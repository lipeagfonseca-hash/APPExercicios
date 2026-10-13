// Registra no GitHub (aba Code -> Deployments) um deploy de produção feito pelo assistente com
// `vercel deploy --prod`. Não faz deploy nenhum: só publica o aviso, para o Mestre acompanhar
// commits, pushes e deploys no GitHub sem precisar de botão nem de token da Vercel.
// Usa o login do `gh` (nunca grava token).
// Uso: node scripts/registrar-deploy.cjs [--url <endereço do deploy>] [--sha <commit>] [--falhou]
//   --url    endereço mostrado no GitHub (padrão: o site de produção)
//   --sha    commit que foi ao ar (padrão: HEAD; precisa já estar no GitHub, faça o push antes)
//   --falhou registra o deploy como falho
const { execFileSync, spawnSync } = require("child_process");

const arg = (nome) => {
  const i = process.argv.indexOf(nome);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const gh = (caminho, corpo) => {
  const r = spawnSync("gh", ["api", caminho, "--method", "POST", "--input", "-"], {
    input: JSON.stringify(corpo),
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "falha ao chamar o gh").trim());
  return JSON.parse(r.stdout);
};

(async () => {
  const sha = arg("--sha") ? git("rev-parse", arg("--sha")) : git("rev-parse", "HEAD");
  const remoto = git("remote", "get-url", "origin").match(/github\.com[:/]([^/]+\/[^/.]+)(\.git)?$/);
  if (!remoto) throw new Error("não achei o repositório do GitHub no remote origin");
  const repo = remoto[1];

  // O commit precisa existir no GitHub (push feito), senão a API recusa.
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"], { stdio: "ignore" });
  } catch {
    throw new Error(`o commit ${sha.slice(0, 7)} ainda não está em origin/main: faça o push antes de registrar o deploy`);
  }

  const url = arg("--url") ?? "https://treino-app-livid.vercel.app";
  const mensagem = git("log", "-1", "--pretty=%s", sha);
  const deploy = gh(`repos/${repo}/deployments`, {
    ref: sha,
    environment: "production",
    description: `Deploy de produção: ${mensagem}`.slice(0, 140),
    auto_merge: false,
    required_contexts: [],
    production_environment: true,
    transient_environment: false,
  });
  gh(`repos/${repo}/deployments/${deploy.id}/statuses`, {
    state: process.argv.includes("--falhou") ? "failure" : "success",
    environment: "production",
    environment_url: url,
    description: `Publicado na Vercel (commit ${sha.slice(0, 7)})`,
  });
  console.log(`deploy registrado no GitHub: ${sha.slice(0, 7)} -> ${url} (https://github.com/${repo}/deployments)`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
