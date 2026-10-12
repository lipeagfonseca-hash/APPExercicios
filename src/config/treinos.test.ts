// Testes da configuração dos treinos A–D e da rotina de alongamento.
// Rodar com: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildSegments } from "../lib/timedProgram.ts";
import { duracaoDoPrograma, validarTreinos } from "../lib/montarTreino.ts";
import { SEQUENCIA_DA_ROTACAO, ID_DO_DESCANSO } from "./rotacao.ts";
import { EXERCICIOS } from "./exercicios.ts";
import { DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS, PARAMETROS_DE_TEMPO } from "./parametrosDeTempo.ts";
import {
  DEFINICOES_DOS_TREINOS,
  DETALHES_DOS_TREINOS,
  PROGRAMA_DE_ALONGAMENTO,
  TREINOS,
  duracaoTotalEmSegundos,
} from "./treinos.ts";

test("nenhum treino passa de 10 minutos (contando preparo, trocas e pausas)", () => {
  for (const id of Object.keys(TREINOS)) {
    assert.ok(
      duracaoTotalEmSegundos(id) <= DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS,
      `treino ${id} dura ${duracaoTotalEmSegundos(id)}s`,
    );
  }
});

test("conta da duração: 5 + 3×(4×30 + 3×10) + 2×60 = 575 s", () => {
  for (const id of Object.keys(TREINOS)) assert.equal(duracaoTotalEmSegundos(id), 575);
});

test("estrutura: 3 blocos de 4 exercícios e exatamente 2 pausas ativas", () => {
  for (const [id, treino] of Object.entries(TREINOS)) {
    assert.equal(treino.timed!.blocks.length, 3, `treino ${id}`);
    for (const bloco of treino.timed!.blocks) assert.equal(bloco.length, 4, `treino ${id}`);
    const pausas = buildSegments(treino).filter((s) => s.kind === "pause");
    assert.equal(pausas.length, 2, `treino ${id}`);
    for (const pausa of pausas) {
      assert.equal(pausa.name, "Marcha estática");
      assert.equal(pausa.seconds, PARAMETROS_DE_TEMPO.segundosDePausaAtiva);
    }
  }
});

test("tudo é por tempo: cada exercício tem duração em segundos e nenhum depende de repetições", () => {
  for (const treino of Object.values(TREINOS)) {
    for (const segmento of buildSegments(treino).filter((s) => s.kind === "work")) {
      assert.equal(segmento.seconds, PARAMETROS_DE_TEMPO.segundosDeEsforcoPorExercicio);
    }
  }
});

test("a sequência da rotação só usa treinos existentes e tem o descanso nos lugares esperados", () => {
  for (const item of SEQUENCIA_DA_ROTACAO) {
    assert.ok(item === ID_DO_DESCANSO || TREINOS[item], `item "${item}" não existe`);
  }
  assert.deepEqual([...SEQUENCIA_DA_ROTACAO], ["A", "B", ID_DO_DESCANSO, "C", "D", ID_DO_DESCANSO]);
});

test("os quatro treinos cobrem o ciclo: inferiores, superiores+core, cardio, core+mobilidade", () => {
  assert.deepEqual(
    DEFINICOES_DOS_TREINOS.map((d) => d.id),
    ["A", "B", "C", "D"],
  );
  assert.match(DEFINICOES_DOS_TREINOS[0].foco, /INFERIORES/);
  assert.match(DEFINICOES_DOS_TREINOS[1].foco, /SUPERIORES/);
  assert.match(DEFINICOES_DOS_TREINOS[2].foco, /CARDIO/);
  assert.match(DEFINICOES_DOS_TREINOS[3].foco, /MOBILIDADE/);
});

test("baixo impacto: nenhum exercício é de salto, burpee ou afundo", () => {
  const proibidos = /salto|pular|burpee|polichinelo|afundo|corrida/i;
  for (const exercicio of Object.values(EXERCICIOS)) {
    assert.ok(!proibidos.test(exercicio.nome), `"${exercicio.nome}" não é de baixo impacto`);
  }
});

test("todo exercício tem nome, instrução curta e um GIF que existe no catálogo", () => {
  const catalogo = JSON.parse(
    readFileSync(new URL("../../data/exercises/rows.json", import.meta.url), "utf8"),
  ) as { id: string }[];
  const ids = new Set(catalogo.map((c) => c.id));

  for (const [id, exercicio] of Object.entries(EXERCICIOS)) {
    assert.ok(exercicio.nome.length > 0, id);
    assert.ok(exercicio.instrucao.length >= 20 && exercicio.instrucao.length <= 220, `instrução de ${id}`);
    assert.ok(ids.has(exercicio.gifId), `GIF ${exercicio.gifId} de "${id}" não existe no catálogo`);
    assert.ok(DETALHES_DOS_TREINOS[exercicio.nome].segundos > 0, id);
  }
});

test("os nomes dos exercícios são únicos", () => {
  const nomes = Object.values(EXERCICIOS).map((e) => e.nome);
  assert.equal(new Set(nomes).size, nomes.length);
});

test("progressão: subir o esforço além do limite faz a validação falhar com mensagem clara", () => {
  assert.throws(
    () =>
      validarTreinos(
        DEFINICOES_DOS_TREINOS,
        EXERCICIOS,
        { ...PARAMETROS_DE_TEMPO, segundosDeEsforcoPorExercicio: 40 },
        DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS,
      ),
    /passa do limite de 600s/,
  );
  // Mas dá para subir o esforço se a pausa diminuir: 5 + 3×(4×35 + 30) + 2×40 = 595 s.
  assert.doesNotThrow(() =>
    validarTreinos(
      DEFINICOES_DOS_TREINOS,
      EXERCICIOS,
      { ...PARAMETROS_DE_TEMPO, segundosDeEsforcoPorExercicio: 35, segundosDePausaAtiva: 40 },
      DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS,
    ),
  );
});

test("rotina de alongamento do descanso: um bloco, sem pausas ativas, curta", () => {
  const segmentos = buildSegments(PROGRAMA_DE_ALONGAMENTO);
  assert.equal(segmentos.filter((s) => s.kind === "pause").length, 0);
  assert.equal(PROGRAMA_DE_ALONGAMENTO.timed!.blocks.length, 1);
  assert.ok(duracaoDoPrograma(PROGRAMA_DE_ALONGAMENTO) < DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS);
});
