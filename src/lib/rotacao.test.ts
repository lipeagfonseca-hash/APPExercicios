// Testes das regras de rotação e do dia de Brasília.
// Rodar com: npm test   (usa o test runner nativo do Node, sem dependências novas)
import test from "node:test";
import assert from "node:assert/strict";
import { diaDeBrasilia, diferencaEmDias, segundosAteMeiaNoite, somarDias } from "./diaBrasilia.ts";
import {
  descreverEstadoDoDia,
  normalizarPonteiro,
  ponteiroAposConcluir,
  projetarProximosDias,
  sequenciaAposConcluir,
  sequenciaExibida,
  validarSequencia,
  type Ponteiro,
} from "./rotacao.ts";

const SEQUENCIA = ["A", "B", "DESCANSO", "C", "D", "DESCANSO"];

// ------------------------------------------------------------------ dia de Brasília

test("o dia vira à 00h de Brasília, não à 00h UTC", () => {
  // 02:00 UTC de 13/10 = 23:00 de 12/10 em Brasília
  assert.equal(diaDeBrasilia(new Date("2026-10-13T02:00:00Z")), "2026-10-12");
  // 03:00 UTC de 13/10 = 00:00 de 13/10 em Brasília
  assert.equal(diaDeBrasilia(new Date("2026-10-13T03:00:00Z")), "2026-10-13");
});

test("somar dias atravessa mês e ano", () => {
  assert.equal(somarDias("2026-10-31", 1), "2026-11-01");
  assert.equal(somarDias("2026-12-31", 1), "2027-01-01");
  assert.equal(somarDias("2026-03-01", -1), "2026-02-28");
});

test("diferença em dias", () => {
  assert.equal(diferencaEmDias("2026-10-10", "2026-10-12"), 2);
  assert.equal(diferencaEmDias("2026-10-12", "2026-10-12"), 0);
});

test("segundos até a meia-noite de Brasília", () => {
  // 23:59:00 em Brasília (02:59:00Z) → 60 s
  assert.equal(segundosAteMeiaNoite(new Date("2026-10-13T02:59:00Z")), 60);
  // 00:00:00 em Brasília → 24 h
  assert.equal(segundosAteMeiaNoite(new Date("2026-10-13T03:00:00Z")), 86_400);
});

// ------------------------------------------------------------------ rotação

test("treino pendente no dia em que começa", () => {
  const ponteiro: Ponteiro = { posicao: 0, itemDesde: "2026-10-12" };
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, ponteiro, "2026-10-12"), {
    tipo: "TREINO_PENDENTE",
    item: "A",
    diasEmAtraso: 0,
  });
});

test("concluir o treino avança o ponteiro e o próximo só vale amanhã", () => {
  const depois = ponteiroAposConcluir(SEQUENCIA, { posicao: 0, itemDesde: "2026-10-12" }, "2026-10-12");
  assert.deepEqual(depois, { posicao: 1, itemDesde: "2026-10-13" });
  // Hoje: já concluído, próximo é o B.
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, depois, "2026-10-12"), {
    tipo: "TREINO_CONCLUIDO_HOJE",
    proximo: "B",
  });
  // Amanhã: B pendente, sem atraso.
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, depois, "2026-10-13"), {
    tipo: "TREINO_PENDENTE",
    item: "B",
    diasEmAtraso: 0,
  });
});

test("treino não concluído continua pendente nos dias seguintes (não pula)", () => {
  const ponteiro: Ponteiro = { posicao: 1, itemDesde: "2026-10-13" };
  // Passaram 3 dias sem treinar: continua o B, com 3 dias de atraso.
  const { ponteiro: normalizado, mudou } = normalizarPonteiro(SEQUENCIA, ponteiro, "2026-10-16");
  assert.equal(mudou, false);
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, normalizado, "2026-10-16"), {
    tipo: "TREINO_PENDENTE",
    item: "B",
    diasEmAtraso: 3,
  });
});

test("posição 2 = descanso: aparece no seu dia e passa quando o dia vira", () => {
  // B concluído em 13/10 → descanso vale em 14/10.
  const aposB = ponteiroAposConcluir(SEQUENCIA, { posicao: 1, itemDesde: "2026-10-13" }, "2026-10-13");
  assert.deepEqual(aposB, { posicao: 2, itemDesde: "2026-10-14" });

  // 14/10: dia de descanso.
  const emDescanso = normalizarPonteiro(SEQUENCIA, aposB, "2026-10-14");
  assert.equal(emDescanso.mudou, false);
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, emDescanso.ponteiro, "2026-10-14"), { tipo: "DESCANSO" });

  // 15/10: o descanso passou → Treino C pendente, sem atraso.
  const aposDescanso = normalizarPonteiro(SEQUENCIA, aposB, "2026-10-15");
  assert.equal(aposDescanso.mudou, true);
  assert.deepEqual(aposDescanso.ponteiro, { posicao: 3, itemDesde: "2026-10-15" });
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, aposDescanso.ponteiro, "2026-10-15"), {
    tipo: "TREINO_PENDENTE",
    item: "C",
    diasEmAtraso: 0,
  });
});

test("ficar dias sem abrir o app durante o descanso não gera atraso", () => {
  const noDescanso: Ponteiro = { posicao: 2, itemDesde: "2026-10-14" };
  const { ponteiro } = normalizarPonteiro(SEQUENCIA, noDescanso, "2026-10-20");
  assert.deepEqual(descreverEstadoDoDia(SEQUENCIA, ponteiro, "2026-10-20"), {
    tipo: "TREINO_PENDENTE",
    item: "C",
    diasEmAtraso: 0,
  });
});

test("a sequência é cíclica: depois do último descanso volta ao Treino A", () => {
  const aposD = ponteiroAposConcluir(SEQUENCIA, { posicao: 4, itemDesde: "2026-10-16" }, "2026-10-16");
  assert.deepEqual(aposD, { posicao: 5, itemDesde: "2026-10-17" });
  const { ponteiro } = normalizarPonteiro(SEQUENCIA, aposD, "2026-10-18");
  assert.deepEqual(ponteiro, { posicao: 0, itemDesde: "2026-10-18" });
});

test("a ordem vem da configuração: outra sequência funciona sem mudar a lógica", () => {
  const outra = ["A", "DESCANSO", "A", "B"];
  const p = ponteiroAposConcluir(outra, { posicao: 0, itemDesde: "2026-10-12" }, "2026-10-12");
  assert.deepEqual(descreverEstadoDoDia(outra, p, "2026-10-13"), { tipo: "DESCANSO" });
});

test("projeção dos próximos dias", () => {
  const projecao = projetarProximosDias(SEQUENCIA, { posicao: 3, itemDesde: "2026-10-15" }, "2026-10-15", 4);
  assert.deepEqual(
    projecao.map((p) => `${p.dia}:${p.item}`),
    ["2026-10-15:C", "2026-10-16:D", "2026-10-17:DESCANSO", "2026-10-18:A"],
  );
});

// ------------------------------------------------------------------ sequência de treinos

test("sequência: continua em dia, zera/recomeça se atrasou", () => {
  assert.equal(sequenciaAposConcluir(4, 0), 5);
  assert.equal(sequenciaAposConcluir(4, 2), 1);
  assert.equal(sequenciaExibida(4, 0), 4);
  assert.equal(sequenciaExibida(4, 1), 0);
});

// ------------------------------------------------------------------ validação da configuração

test("validação da sequência", () => {
  assert.doesNotThrow(() => validarSequencia(SEQUENCIA, ["A", "B", "C", "D"]));
  assert.throws(() => validarSequencia([], ["A"]), /vazia/);
  assert.throws(() => validarSequencia(["DESCANSO"], ["A"]), /pelo menos um treino/);
  assert.throws(() => validarSequencia(["A", "Z"], ["A"]), /"Z"/);
});
