// Testes de esforço acumulado, atributos reais, rank por exercício e conquistas.
// Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { calcularAtributos } from "./atributos.ts";
import { esforcoDeUmTreino, somarEsforco } from "./esforco.ts";
import { calcularRanks, proximoRank, rankPorMinutos } from "./rank.ts";
import { evaluateAchievements } from "./achievements.ts";
import { EXERCICIOS } from "../config/exercicios.ts";
import { TREINOS } from "../config/treinos.ts";

const atributoPorExercicio = Object.fromEntries(Object.values(EXERCICIOS).map((e) => [e.nome, e.atributo])) as Record<
  string,
  "STR" | "AGI" | "END"
>;

// ------------------------------------------------------------------ esforço

test("um treino tem 12 exercícios × 30 s = 360 s de esforço e 120 s de pausas ativas", () => {
  for (const [id, treino] of Object.entries(TREINOS)) {
    const e = esforcoDeUmTreino(treino);
    const soExercicios = Object.values(e.porExercicio).reduce((a, b) => a + b, 0);
    assert.equal(soExercicios, 360, `treino ${id}`);
    assert.equal(e.pausaSegundos, 120, `treino ${id}`);
    assert.equal(e.totalSegundos, 480, `treino ${id}`);
  }
});

test("somar esforço: treinos feitos várias vezes e treinos que saíram da configuração", () => {
  const soma = somarEsforco({ A: 2, B: 1, TREINO_REMOVIDO: 5 }, TREINOS);
  assert.equal(soma.totalSegundos, 480 * 3);
  assert.equal(soma.pausaSegundos, 120 * 3);
  // Agachamento com apoio aparece 2× no treino A (30 s cada): 2 × 2 treinos × 30 s = 120 s.
  assert.equal(soma.porExercicio["Agachamento com apoio"], 120);
  assert.deepEqual(somarEsforco({}, TREINOS), { porExercicio: {}, pausaSegundos: 0, totalSegundos: 0 });
});

// ------------------------------------------------------------------ atributos

test("atributos começam em 10 e vêm só do histórico real", () => {
  const zerado = calcularAtributos({
    esforco: somarEsforco({}, TREINOS),
    atributoPorExercicio,
    treinosConcluidos: 0,
    melhorSequencia: 0,
  });
  assert.deepEqual(zerado, { STR: 10, AGI: 10, END: 10, VIT: 10 });
});

test("atributos: força, agilidade e resistência por minuto; vitalidade por consistência", () => {
  const esforco = somarEsforco({ A: 10 }, TREINOS);
  const a = calcularAtributos({ esforco, atributoPorExercicio, treinosConcluidos: 10, melhorSequencia: 7 });
  // Treino A (10×): 360 s por treino, todos de força, exceto "Marcha acelerada" (END) 30 s.
  // Força: (360 − 30) × 10 / 60 = 55 min → 10 + 55 = 65.
  assert.equal(a.STR, 65);
  assert.equal(a.AGI, 10);
  // Resistência: marcha acelerada 30 s + pausas 120 s = 150 s por treino × 10 = 25 min → 35.
  assert.equal(a.END, 35);
  // Vitalidade: 10 + 10 treinos + 7 de melhor sequência.
  assert.equal(a.VIT, 27);
});

test("todo exercício tem um atributo válido", () => {
  for (const [id, e] of Object.entries(EXERCICIOS)) {
    assert.ok(["STR", "AGI", "END"].includes(e.atributo), id);
  }
});

// ------------------------------------------------------------------ rank por exercício

test("rank por minutos acumulados", () => {
  assert.equal(rankPorMinutos(0), "E");
  assert.equal(rankPorMinutos(4.9), "E");
  assert.equal(rankPorMinutos(5), "D");
  assert.equal(rankPorMinutos(30), "B");
  assert.equal(rankPorMinutos(80), "S");
  assert.equal(rankPorMinutos(159), "SS");
  assert.equal(rankPorMinutos(160), "SSS");
  assert.equal(rankPorMinutos(999), "SSS");
});

test("próximo rank e minutos que faltam", () => {
  assert.deepEqual(proximoRank(20), { rank: "B", faltamMinutos: 10 });
  assert.equal(proximoRank(160), null);
});

test("calibração: em um ano perfeito os exercícios mais frequentes chegam ao topo e os raros a B", () => {
  // ~244 treinos por ano → 61 de cada treino.
  const ano = somarEsforco({ A: 61, B: 61, C: 61, D: 61 }, TREINOS);
  const ranks = Object.fromEntries(calcularRanks(ano.porExercicio).map((r) => [r.name, r.rank]));
  assert.equal(ranks["Arqueiro em pé"], "SSS"); // o mais frequente (~183 min)
  assert.equal(ranks["Flexão inclinada"], "B"); // o mais raro (~31 min)
  assert.equal(ranks["Agachamento com apoio"], "S"); // intermediário (~92 min)
  assert.ok(!("Marcha estática" in ranks), "a pausa ativa não entra no rank de exercícios");
});

test("ranks ordenados do mais treinado para o menos treinado", () => {
  const linhas = calcularRanks({ a: 600, b: 3600, c: 0 });
  assert.deepEqual(linhas.map((l) => l.name), ["b", "a"]);
});

// ------------------------------------------------------------------ conquistas

test("conquistas desbloqueiam por dados reais", () => {
  const base = { treinosConcluidos: 0, minutosDeEsforco: 0, melhorSequencia: 0, nivel: 1, melhorRank: null, accountAgeDays: 0 };
  const nenhuma = evaluateAchievements(base);
  assert.equal(nenhuma.filter((a) => a.unlocked).length, 0);

  const alguma = evaluateAchievements({ ...base, treinosConcluidos: 12, minutosDeEsforco: 70, melhorSequencia: 5, nivel: 10, melhorRank: "D" as const });
  const ids = new Set(alguma.filter((a) => a.unlocked).map((a) => a.id));
  for (const esperado of ["first-workout", "10-workouts", "minutes-60", "streak-5", "level-10", "rank-d"]) {
    assert.ok(ids.has(esperado), esperado);
  }
  assert.ok(!ids.has("50-workouts"));
  assert.ok(!ids.has("level-20"));
});
