// Testes de XP, níveis, classes e da META: classe E → S em 1 ano sem faltar.
// Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { somarDias, type Dia } from "./diaBrasilia.ts";
import {
  aplicarXp,
  classeDoNivel,
  treinosParaOProximoBonus,
  xpDoTreino,
  xpParaSubirDeNivel,
} from "./progressao.ts";
import {
  descreverEstadoDoDia,
  normalizarPonteiro,
  ponteiroAposConcluir,
  sequenciaAposConcluir,
  type Ponteiro,
} from "./rotacao.ts";
import { SEQUENCIA_DA_ROTACAO } from "../config/rotacao.ts";

// ------------------------------------------------------------------ contas básicas

test("classes: E é a mais baixa, S a mais alta", () => {
  assert.equal(classeDoNivel(1), "E");
  assert.equal(classeDoNivel(9), "E");
  assert.equal(classeDoNivel(10), "D");
  assert.equal(classeDoNivel(19), "D");
  assert.equal(classeDoNivel(20), "C");
  assert.equal(classeDoNivel(30), "B");
  assert.equal(classeDoNivel(40), "A");
  assert.equal(classeDoNivel(49), "A");
  assert.equal(classeDoNivel(50), "S");
  assert.equal(classeDoNivel(80), "S");
});

test("bônus de sequência a cada 5 treinos seguidos", () => {
  assert.deepEqual(xpDoTreino(1), { base: 100, bonus: 0, total: 100 });
  assert.deepEqual(xpDoTreino(4), { base: 100, bonus: 0, total: 100 });
  assert.deepEqual(xpDoTreino(5), { base: 100, bonus: 200, total: 300 });
  assert.deepEqual(xpDoTreino(6), { base: 100, bonus: 0, total: 100 });
  assert.deepEqual(xpDoTreino(10), { base: 100, bonus: 200, total: 300 });
  assert.equal(xpDoTreino(0).bonus, 0);
});

test("quantos treinos faltam para o próximo bônus", () => {
  assert.equal(treinosParaOProximoBonus(0), 5);
  assert.equal(treinosParaOProximoBonus(3), 2);
  assert.equal(treinosParaOProximoBonus(4), 1);
  assert.equal(treinosParaOProximoBonus(5), 5);
});

test("subir de nível: sobra de XP passa para o nível seguinte", () => {
  const custo = xpParaSubirDeNivel(1);
  assert.equal(custo, 690);
  assert.deepEqual(aplicarXp(1, 0, 100), { nivel: 1, xp: 100, niveisGanhos: 0 });
  assert.deepEqual(aplicarXp(1, 600, 100), { nivel: 2, xp: 10, niveisGanhos: 1 });
  assert.deepEqual(aplicarXp(1, 0, custo * 2 + 5), { nivel: 3, xp: 5, niveisGanhos: 2 });
});

// ------------------------------------------------------------------ a meta: S em 1 ano

type Marco = { nivel: number; dia: number };

/**
 * Simula um jogador que faz TODO treino no dia em que ele aparece, usando as
 * mesmas regras de rotação e de XP do app. Devolve o dia (1 = primeiro dia) em
 * que cada nível foi alcançado.
 * `faltarNoDia`: dias (1-based) em que o jogador não treina.
 */
function simular(diasTotais: number, faltarNoDia: number[] = []): Marco[] {
  const inicio: Dia = "2026-01-01";
  let ponteiro: Ponteiro = { posicao: 0, itemDesde: inicio };
  let nivel = 1;
  let xp = 0;
  let sequencia = 0;
  const marcos: Marco[] = [];

  for (let dia = 1; dia <= diasTotais; dia++) {
    const hoje = somarDias(inicio, dia - 1);
    ponteiro = normalizarPonteiro(SEQUENCIA_DA_ROTACAO, ponteiro, hoje).ponteiro;
    const estado = descreverEstadoDoDia(SEQUENCIA_DA_ROTACAO, ponteiro, hoje);
    if (estado.tipo !== "TREINO_PENDENTE" || faltarNoDia.includes(dia)) continue;

    sequencia = sequenciaAposConcluir(sequencia, estado.diasEmAtraso);
    const ganho = aplicarXp(nivel, xp, xpDoTreino(sequencia).total);
    for (let n = nivel + 1; n <= ganho.nivel; n++) marcos.push({ nivel: n, dia });
    nivel = ganho.nivel;
    xp = ganho.xp;
    ponteiro = ponteiroAposConcluir(SEQUENCIA_DA_ROTACAO, ponteiro, hoje);
  }
  return marcos;
}

const diaDoNivel = (marcos: Marco[], nivel: number) => marcos.find((m) => m.nivel === nivel)?.dia;

test("META: um ano direto, sem faltar, leva da classe E à classe S", () => {
  const marcos = simular(400);
  const diaS = diaDoNivel(marcos, 50);
  assert.ok(diaS !== undefined, "nunca chegou ao nível 50");
  // Dentro de 1 ano, mas sem ser fácil demais (não antes do dia 340).
  assert.ok(diaS <= 365, `classe S só no dia ${diaS}`);
  assert.ok(diaS >= 340, `classe S cedo demais (dia ${diaS})`);
});

test("marcos intermediários: classes sobem de forma espaçada ao longo do ano", () => {
  const marcos = simular(400);
  const d = diaDoNivel(marcos, 10)!; // classe D
  const c = diaDoNivel(marcos, 20)!; // classe C
  const b = diaDoNivel(marcos, 30)!; // classe B
  const a = diaDoNivel(marcos, 40)!; // classe A
  const s = diaDoNivel(marcos, 50)!; // classe S
  assert.ok(d < c && c < b && b < a && a < s);
  // A primeira promoção (classe D) vem em poucos meses, para dar motivação.
  assert.ok(d <= 80, `classe D só no dia ${d}`);
  console.log(`  marcos (dias): D=${d} C=${c} B=${b} A=${a} S=${s}`);
});

test("faltar treino custa caro: perde o bônus e a classe S demora mais que 1 ano", () => {
  const perfeito = diaDoNivel(simular(600), 50)!;
  // Falta um treino a cada ~2 meses (o treino fica pendente e a sequência zera).
  const faltas = [20, 80, 140, 200, 260, 320];
  const comFaltas = diaDoNivel(simular(600, faltas), 50)!;
  assert.ok(comFaltas > perfeito, `com faltas ${comFaltas} deveria ser depois de ${perfeito}`);
  assert.ok(comFaltas > 365);
});

test("descanso não dá XP e não atrasa: dias de descanso não geram progresso nem perda", () => {
  // Nos 6 dias do ciclo só 4 treinos rendem XP.
  const marcos = simular(6);
  const xpTotal = 4 * 100; // 4 treinos, ainda sem completar 5 seguidos
  assert.equal(marcos.length, 0);
  assert.equal(aplicarXp(1, 0, xpTotal).nivel, 1);
});
