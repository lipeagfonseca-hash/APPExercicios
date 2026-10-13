import test from "node:test";
import assert from "node:assert/strict";
import { criarVerificadorDeUsuario } from "./verificadorDeUsuario.ts";

test("consulta o banco uma vez por janela e depois reaproveita", async () => {
  let consultas = 0;
  let agora = 1_000;
  const ativo = criarVerificadorDeUsuario(
    async () => {
      consultas += 1;
      return { desativadoEm: null };
    },
    300_000,
    () => agora,
  );

  assert.equal(await ativo("u1"), true);
  assert.equal(await ativo("u1"), true);
  agora += 299_000;
  assert.equal(await ativo("u1"), true);
  assert.equal(consultas, 1);

  agora += 2_000; // passou da validade
  assert.equal(await ativo("u1"), true);
  assert.equal(consultas, 2);
});

test("usuário desativado ou apagado deixa de ser ativo assim que a validade vence", async () => {
  let registro: { desativadoEm: Date | null } | null = { desativadoEm: null };
  let agora = 0;
  const ativo = criarVerificadorDeUsuario(async () => registro, 60_000, () => agora);

  assert.equal(await ativo("u1"), true);
  registro = { desativadoEm: new Date() };
  assert.equal(await ativo("u1"), true); // ainda dentro da janela
  agora += 61_000;
  assert.equal(await ativo("u1"), false); // desativado

  registro = null;
  agora += 61_000;
  assert.equal(await ativo("u1"), false); // apagado
});

test("cada usuário tem a sua própria validade", async () => {
  const consultados: string[] = [];
  const ativo = criarVerificadorDeUsuario(
    async (id) => {
      consultados.push(id);
      return id === "b" ? null : { desativadoEm: null };
    },
    60_000,
    () => 0,
  );
  assert.equal(await ativo("a"), true);
  assert.equal(await ativo("b"), false);
  assert.equal(await ativo("a"), true);
  assert.deepEqual(consultados, ["a", "b"]);
});
