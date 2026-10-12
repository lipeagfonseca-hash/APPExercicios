// Gera public/fonts/material-symbols-icones.woff2: um subconjunto da fonte Material Symbols
// (Apache 2.0) só com os ícones listados em src/lib/icones.ts. Baixa o subconjunto do Google
// uma vez, no desenvolvimento; o app em produção não faz nenhum pedido a servidores de terceiros.
// Também grava a lista usada (um teste confere que ela bate com src/lib/icones.ts).
// Uso: node scripts/gerar-fonte-de-icones.cjs
const fs = require("fs");
const path = require("path");

const origem = fs.readFileSync(path.join(__dirname, "../src/lib/icones.ts"), "utf8");
const nomes = [...origem.matchAll(/^\s+"([a-z0-9_]+)",$/gm)].map((m) => m[1]).sort();
if (nomes.length === 0) throw new Error("Nenhum ícone encontrado em src/lib/icones.ts");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const url =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=" +
  nomes.join(",");

(async () => {
  const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  const fonte = css.match(/url\((https:\/\/[^)]+)\)/)?.[1];
  if (!fonte) throw new Error("O Google não devolveu a URL da fonte:\n" + css.slice(0, 300));

  const bytes = Buffer.from(await (await fetch(fonte, { headers: { "User-Agent": UA } })).arrayBuffer());
  const pasta = path.join(__dirname, "../public/fonts");
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(path.join(pasta, "material-symbols-icones.woff2"), bytes);
  fs.writeFileSync(path.join(pasta, "material-symbols-icones.lista.txt"), nomes.join("\n") + "\n");
  console.log(`${nomes.length} ícones -> public/fonts/material-symbols-icones.woff2 (${bytes.length} bytes)`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
