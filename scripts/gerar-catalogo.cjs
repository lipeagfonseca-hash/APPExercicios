// Gera src/data/catalogo-exercicios.json: o catálogo ESTÁTICO de exercícios, indexável por id.
// Junta os dados do dataset (data/exercises/rows.json) com os nomes em português feitos à mão
// (data/exercises/pt.txt). O resultado é versionado: o app lê este arquivo uma única vez
// (escopo de módulo) em vez de consultar o banco a cada requisição.
// Uso: node scripts/gerar-catalogo.cjs
const fs = require("fs");
const path = require("path");

const linhas = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/exercises/rows.json"), "utf8"));
const nomesPt = new Map(
  fs.readFileSync(path.join(__dirname, "../data/exercises/pt.txt"), "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf("|")), l.slice(l.indexOf("|") + 1).trim()]),
);

// Exercícios fora do app (barras/academia e impacto nas articulações): ver
// data/exercises/excluidos.txt, gerado por scripts/selecionar-exercicios.cjs.
const excluidos = new Set(
  fs.readFileSync(path.join(__dirname, "../data/exercises/excluidos.txt"), "utf8")
    .split(/\r?\n/).filter(Boolean).map((l) => l.slice(0, l.indexOf("|"))),
);

const normalizar = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const catalogo = linhas
  .filter((r) => !excluidos.has(r.id))
  .map((r) => {
    const nome = nomesPt.get(r.id);
    if (!nome) throw new Error(`Sem tradução para ${r.id} (${r.nameEn})`);
    return {
      id: r.id,
      nome,
      nomeEn: r.nameEn,
      regiao: r.bodyPart,
      equipamento: r.equipment,
      alvo: r.target,
      secundarios: r.secondary ?? [],
      instrucoesEn: r.instructionsEn ?? null,
      instrucoesEs: r.instructionsEs ?? null,
      // texto de busca já normalizado (sem acento, minúsculo)
      busca: normalizar([nome, r.nameEn, r.target, r.bodyPart, r.equipment].join(" ")),
    };
  })
  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

const saida = path.join(__dirname, "../src/data/catalogo-exercicios.json");
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, JSON.stringify(catalogo));
console.log(`${catalogo.length} exercícios -> ${path.relative(process.cwd(), saida)} (${Math.round(fs.statSync(saida).size / 1024)} KB)`);
