// Decide quais exercícios do dataset NÃO entram no app e grava data/exercises/excluidos.txt
// (formato `id|motivo`). Critérios pedidos pelo Mestre (obeso, retomando o treino):
//   1. nada que use barra ou equipamento de academia;
//   2. nada com impacto ou alta carga nas articulações.
// O gerador do catálogo e o download de mídia pulam os ids desta lista; `rows.json` não é
// alterado, então dá para reincluir um exercício apagando a linha dele em excluidos.txt.
// Os exercícios usados nos treinos (src/config/exercicios.ts) nunca são excluídos.
// Uso: node scripts/selecionar-exercicios.cjs
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const linhas = JSON.parse(fs.readFileSync(path.join(raiz, "data/exercises/rows.json"), "utf8"));
const nomesPt = new Map(
  fs.readFileSync(path.join(raiz, "data/exercises/pt.txt"), "utf8")
    .split(/\r?\n/).filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf("|")), l.slice(l.indexOf("|") + 1).trim()]),
);

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Treinos em uso: proteção contra excluir um exercício que um treino precisa.
const usados = new Set(
  [...fs.readFileSync(path.join(raiz, "src/config/exercicios.ts"), "utf8").matchAll(/gifId:\s*"(\d{4})"/g)].map((m) => m[1]),
);

// Equipamento de academia ou que exige barra/aparelho/anel/banco, mesmo sendo "peso do corpo".
const APARELHO = /barra|paralelas|argolas|muscle-up|suspens|rollout|cadeira romana|hiperextens|gaiola|skin the cat|front lever|back lever|bandeira humana|elevator|slingers|esterno|rocky|gorila|banco|caixa|toalha|fitas|body-up|bottoms-up|butt-ups|limpadores|remada invertida|remada agachado|remada em pe|declinad/;
// Impacto (saltos, corrida, quedas) ou alta carga em joelho, punho, ombro e coluna.
const IMPACTO = /salto|polichinelo|burpee|corrida|tiros|passos rapidos|skater|pliometrica|queda|mountain climber|empurrar para corrida|joelhos altos com afundo/;
const CARGA = /afundo|passada|pistol|sissy|uma perna|um braco|mergulho|parada de mao|planche|maltese|stalder|l-sit|v-sit|flexora invertida|bulgaro|palma|arqueiro|superman|aranha|sapo|giro russo/;

// Ajustes feitos depois de ler a descrição (instruções) de cada exercício; as regras acima
// erram em alguns nomes. Incluir = a descrição mostra que não usa aparelho e é de baixo impacto.
const INCLUIR = new Set(["0138", "0870", "2429", "0668", "0696", "1355", "1386", "1387", "3645", "3161", "3167", "1773"]);
// Excluir = a descrição pede halter, banco inclinado, faixa elástica, aparelho, salto ou afundo.
const EXCLUIR = new Map([
  ["1770", "equipamento: halter (descrição)"], ["3193", "equipamento: máquina (descrição)"],
  ["0020", "equipamento: prancha de equilíbrio"], ["0628", "equipamento: faixa elástica"],
  ["0495", "exige banco inclinado"], ["0491", "exige banco inclinado"], ["3011", "exige banco inclinado"],
  ["3672", "afundo"], ["2368", "afundo"], ["1687", "afundo"], ["3769", "afundo"],
  ["1604", "afundo"], ["1585", "afundo"],
  ["3671", "impacto: salto"], ["1418", "impacto: salto"], ["0257", "carga alta nas articulações"],
]);

const excluidos = [];
for (const r of linhas) {
  if (usados.has(r.id)) continue;
  if (EXCLUIR.has(r.id)) { excluidos.push(`${r.id}|${EXCLUIR.get(r.id)}`); continue; }
  if (INCLUIR.has(r.id)) continue;
  const nome = norm(nomesPt.get(r.id) ?? r.nameEn);
  let motivo = null;
  if (r.equipment !== "Peso do corpo") motivo = `equipamento: ${r.equipment}`;
  else if (APARELHO.test(nome)) motivo = "exige barra/aparelho";
  else if (IMPACTO.test(nome)) motivo = "impacto";
  else if (CARGA.test(nome)) motivo = "carga alta nas articulações";
  if (motivo) excluidos.push(`${r.id}|${motivo}`);
}

fs.writeFileSync(path.join(raiz, "data/exercises/excluidos.txt"), excluidos.join("\n") + "\n");
const porMotivo = {};
for (const l of excluidos) {
  const m = l.split("|")[1].split(":")[0];
  porMotivo[m] = (porMotivo[m] ?? 0) + 1;
}
console.log(`${linhas.length} no dataset-recorte, ${excluidos.length} excluídos, ${linhas.length - excluidos.length} ficam`, porMotivo);
