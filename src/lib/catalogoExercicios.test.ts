// Testes do catálogo estático (src/data/catalogo-exercicios.json).
// Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EXERCICIOS } from "../config/exercicios.ts";

type Item = { id: string; nome: string; nomeEn: string; instrucoesEn: string | null; busca: string };

const catalogo = JSON.parse(
  readFileSync(new URL("../data/catalogo-exercicios.json", import.meta.url), "utf8"),
) as Item[];

test("o catálogo estático tem os 370 exercícios, com ids únicos e nomes em português", () => {
  assert.equal(catalogo.length, 370);
  assert.equal(new Set(catalogo.map((e) => e.id)).size, catalogo.length);
  for (const e of catalogo) {
    assert.match(e.id, /^\d{4}$/);
    assert.ok(e.nome.length > 0, e.id);
    assert.ok(e.instrucoesEn, `instruções de ${e.id}`);
  }
});

test("todo GIF usado nos treinos existe no catálogo estático", () => {
  const ids = new Set(catalogo.map((e) => e.id));
  for (const [chave, exercicio] of Object.entries(EXERCICIOS)) {
    assert.ok(ids.has(exercicio.gifId), `${chave} usa o GIF ${exercicio.gifId}`);
  }
});

test("o texto de busca é normalizado (sem acento e minúsculo)", () => {
  for (const e of catalogo) {
    assert.equal(e.busca, e.busca.toLowerCase());
    assert.ok(!/[\u0300-\u036f]/.test(e.busca.normalize("NFD")), e.id);
  }
});
