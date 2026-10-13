// Baixa as miniaturas e GIFs do catálogo para public/exercises/.
// As mídias são © Gym visual (https://gymvisual.com/) e NÃO ficam no git:
// o repositório só guarda os dados (data/exercises). Veja NOTICE.md.
// Uso: node scripts/fetch-exercise-media.cjs
const fs = require("fs");
const path = require("path");

const BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";
const excluidos = new Set(
  fs.readFileSync(path.join(__dirname, "../data/exercises/excluidos.txt"), "utf8")
    .split(/\r?\n/).filter(Boolean).map((l) => l.slice(0, l.indexOf("|"))),
);
// só o que está no catálogo do app (o resto fica de fora do deploy)
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/exercises/rows.json"), "utf8"))
  .filter((r) => !excluidos.has(r.id));
const root = path.join(__dirname, "../public/exercises");

async function baixar(relativo, destino) {
  if (fs.existsSync(destino) && fs.statSync(destino).size > 0) return true;
  const resposta = await fetch(BASE + encodeURI(relativo));
  if (!resposta.ok) return false;
  fs.writeFileSync(destino, Buffer.from(await resposta.arrayBuffer()));
  return true;
}

(async () => {
  fs.mkdirSync(path.join(root, "thumb"), { recursive: true });
  fs.mkdirSync(path.join(root, "gif"), { recursive: true });

  let falhas = 0;
  const fila = [...rows];
  const trabalhadores = Array.from({ length: 8 }, async () => {
    while (fila.length) {
      const r = fila.pop();
      const ok1 = await baixar(r.image, path.join(root, "thumb", `${r.id}.jpg`));
      const ok2 = await baixar(r.gif, path.join(root, "gif", `${r.id}.gif`));
      if (!ok1 || !ok2) {
        falhas += 1;
        console.error("falhou:", r.id, r.nameEn);
      }
    }
  });
  await Promise.all(trabalhadores);
  console.log(`concluído: ${rows.length - falhas}/${rows.length} exercícios com mídia`);
  process.exit(falhas ? 1 : 0);
})();
