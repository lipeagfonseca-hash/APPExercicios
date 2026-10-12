// Testes das regras do aquecimento. Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { dentroDaJanelaDeAquecimento, horasDeAquecimentoPorDia, segredosIguais, tokenDoBearer } from "./aquecimento.ts";
import { horaDeBrasilia } from "./diaBrasilia.ts";
import { JANELAS_DE_AQUECIMENTO } from "../config/aquecimento.ts";

test("hora de Brasília (UTC−3, sem horário de verão)", () => {
  assert.equal(horaDeBrasilia(new Date("2026-10-13T21:30:00Z")), 18);
  assert.equal(horaDeBrasilia(new Date("2026-10-13T03:00:00Z")), 0);
  assert.equal(horaDeBrasilia(new Date("2026-10-13T02:59:00Z")), 23);
});

test("janelas: a hora inicial vale e a final não (06–09 e 18–21)", () => {
  const em = (iso: string) => dentroDaJanelaDeAquecimento(JANELAS_DE_AQUECIMENTO, new Date(iso));
  assert.equal(em("2026-10-13T09:00:00Z"), true); //  06:00 em Brasília
  assert.equal(em("2026-10-13T11:59:00Z"), true); //  08:59
  assert.equal(em("2026-10-13T12:00:00Z"), false); // 09:00
  assert.equal(em("2026-10-13T20:59:00Z"), false); // 17:59
  assert.equal(em("2026-10-13T21:00:00Z"), true); //  18:00
  assert.equal(em("2026-10-13T23:30:00Z"), true); //  20:30
  assert.equal(em("2026-10-14T00:30:00Z"), false); // 21:30 (a janela termina às 21:00)
});

test("fora das janelas (madrugada e meio do dia) não aquece", () => {
  const em = (iso: string) => dentroDaJanelaDeAquecimento(JANELAS_DE_AQUECIMENTO, new Date(iso));
  assert.equal(em("2026-10-13T06:00:00Z"), false); // 03:00
  assert.equal(em("2026-10-13T15:00:00Z"), false); // 12:00
});

test("cota do Neon: as janelas atuais ficam bem abaixo das 100 CU-horas por mês", () => {
  const horasPorDia = horasDeAquecimentoPorDia(JANELAS_DE_AQUECIMENTO);
  assert.equal(horasPorDia, 6);
  const cuHorasPorMes = horasPorDia * 30 * 0.25; // compute mínimo de 0,25 CU
  assert.ok(cuHorasPorMes <= 50, `${cuHorasPorMes} CU-h/mês deixa pouca margem na cota de 100`);
});

test("segredo: comparação segura e leitura do Bearer", () => {
  assert.equal(segredosIguais("abc123", "abc123"), true);
  assert.equal(segredosIguais("abc123", "abc124"), false);
  assert.equal(segredosIguais("", "abc123"), false);
  assert.equal(tokenDoBearer("Bearer xyz"), "xyz");
  assert.equal(tokenDoBearer("bearer xyz"), "xyz");
  assert.equal(tokenDoBearer("Basic xyz"), "");
  assert.equal(tokenDoBearer(null), "");
});
