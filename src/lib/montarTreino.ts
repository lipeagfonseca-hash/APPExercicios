// ============================================================================
// MONTAGEM DOS TREINOS (regras puras)
// ----------------------------------------------------------------------------
// Transforma a configuração (ids de exercício + parâmetros de tempo) no
// `Program` que o cronômetro e as telas usam, e valida a configuração.
// Sem banco e sem React, para poder ser testado com `npm test`.
// ============================================================================

import type { Program, TimedPlan } from "./programs.ts";
import { buildSegments, totalSeconds } from "./timedProgram.ts";

export type ExercicioConfig = {
  nome: string;
  tipo: "STRENGTH" | "CARDIO";
  gifId: string;
  instrucao: string;
  repeticoesEstimadas: number;
  segundos?: number;
};

export type DefinicaoDeTreino = {
  id: string;
  nome: string;
  /** Ex.: "Membros inferiores". */
  foco: string;
  nivel: Program["difficulty"];
  descricao: string;
  /** Ids de exercício, bloco a bloco. */
  blocos: string[][];
};

export type ParametrosDoTreino = {
  segundosDeEsforcoPorExercicio: number;
  segundosDeTroca: number;
  /** 0 quando o treino tem um único bloco (não há pausa ativa). */
  segundosDePausaAtiva: number;
  segundosDePreparo: number;
  exercicioDaPausaAtiva: string;
};

/** O que a tela precisa saber de cada exercício (indexado pelo nome). */
export type DetalheDoExercicio = {
  gifId: string;
  instrucao: string;
  segundos: number;
};

function nomeDe(exercicios: Record<string, ExercicioConfig>, id: string): string {
  const exercicio = exercicios[id];
  if (!exercicio) throw new Error(`Exercício "${id}" não existe em src/config/exercicios.ts.`);
  return exercicio.nome;
}

/** Monta o programa por tempo a partir da definição. Ex.: ids ["agachamento-apoio"] → nome "Agachamento com apoio". */
export function montarPrograma(
  definicao: DefinicaoDeTreino,
  exercicios: Record<string, ExercicioConfig>,
  parametros: ParametrosDoTreino,
): Program {
  const blocks = definicao.blocos.map((bloco) => bloco.map((id) => nomeDe(exercicios, id)));

  // Duração própria de algum exercício (quando houver).
  const secondsByExercise: Record<string, number> = {};
  for (const id of definicao.blocos.flat()) {
    const exercicio = exercicios[id];
    if (exercicio?.segundos !== undefined) secondsByExercise[exercicio.nome] = exercicio.segundos;
  }

  const plan: TimedPlan = {
    workSeconds: parametros.segundosDeEsforcoPorExercicio,
    transitionSeconds: parametros.segundosDeTroca,
    pauseSeconds: parametros.segundosDePausaAtiva,
    pauseExercise: nomeDe(exercicios, parametros.exercicioDaPausaAtiva),
    prepareSeconds: parametros.segundosDePreparo,
    blocks,
    ...(Object.keys(secondsByExercise).length ? { secondsByExercise } : {}),
  };

  // Lista única de exercícios (quantas vezes cada um aparece vira o nº de séries).
  const vezes = new Map<string, number>();
  for (const id of definicao.blocos.flat()) vezes.set(id, (vezes.get(id) ?? 0) + 1);

  const programa: Program = {
    id: definicao.id,
    name: definicao.nome,
    className: definicao.foco,
    difficulty: definicao.nivel,
    description: definicao.descricao,
    timed: plan,
    exercises: [...vezes.entries()].map(([id, quantidade]) => ({
      name: nomeDe(exercicios, id),
      type: exercicios[id].tipo,
      sets: Array.from({ length: quantidade }, () => ({
        reps: exercicios[id].repeticoesEstimadas,
        weightKg: null,
      })),
    })),
  };
  return programa;
}

/** Detalhes (GIF, instrução, duração) de todos os exercícios, indexados pelo nome. */
export function montarDetalhes(
  exercicios: Record<string, ExercicioConfig>,
  segundosPadrao: number,
): Record<string, DetalheDoExercicio> {
  return Object.fromEntries(
    Object.values(exercicios).map((e) => [
      e.nome,
      { gifId: e.gifId, instrucao: e.instrucao, segundos: e.segundos ?? segundosPadrao },
    ]),
  );
}

export function duracaoDoPrograma(programa: Program): number {
  return totalSeconds(buildSegments(programa));
}

/**
 * Confere a configuração e lança um erro claro se algo estiver errado.
 * Ex.: um treino de 11 min → "O treino A dura 665s e passa do limite de 600s ...".
 */
export function validarTreinos(
  definicoes: DefinicaoDeTreino[],
  exercicios: Record<string, ExercicioConfig>,
  parametros: ParametrosDoTreino,
  duracaoMaximaEmSegundos: number,
) {
  const nomes = Object.values(exercicios).map((e) => e.nome);
  const repetidos = nomes.filter((n, i) => nomes.indexOf(n) !== i);
  if (repetidos.length) throw new Error(`Há exercícios com nome repetido: ${[...new Set(repetidos)].join(", ")}.`);

  for (const [id, exercicio] of Object.entries(exercicios)) {
    if (!/^\d{4}$/.test(exercicio.gifId)) throw new Error(`O exercício "${id}" tem gifId inválido ("${exercicio.gifId}").`);
  }

  for (const definicao of definicoes) {
    if (definicao.blocos.length === 0 || definicao.blocos.some((b) => b.length === 0)) {
      throw new Error(`O treino ${definicao.id} tem bloco vazio.`);
    }
    const programa = montarPrograma(definicao, exercicios, parametros);
    const segundos = duracaoDoPrograma(programa);
    if (segundos > duracaoMaximaEmSegundos) {
      throw new Error(
        `O treino ${definicao.id} dura ${segundos}s e passa do limite de ${duracaoMaximaEmSegundos}s. ` +
          "Reduza o esforço, as trocas, as pausas ou o número de blocos em src/config/parametrosDeTempo.ts.",
      );
    }
  }
}
