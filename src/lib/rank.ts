// ============================================================================
// RANK POR EXERCÍCIO (regras puras)
// ----------------------------------------------------------------------------
// O rank de cada exercício vem do TEMPO de esforço acumulado nele (nada de
// repetições). Os limites, em minutos, ficam em src/config/xp.ts.
//
// Ex.: 20 min de "Agachamento com apoio" acumulados → rank C (15 min); faltam
// 10 min para o B (30 min).
// ============================================================================

import { MINUTOS_PARA_CADA_RANK_DE_EXERCICIO } from "../config/xp.ts";

export type ExerciseRank = (typeof MINUTOS_PARA_CADA_RANK_DE_EXERCICIO)[number]["rank"];

export const EXERCISE_RANKS: ExerciseRank[] = MINUTOS_PARA_CADA_RANK_DE_EXERCICIO.map((r) => r.rank);

/** Rank para um tempo acumulado em minutos. */
export function rankPorMinutos(minutos: number): ExerciseRank {
  let rank: ExerciseRank = MINUTOS_PARA_CADA_RANK_DE_EXERCICIO[0].rank;
  for (const faixa of MINUTOS_PARA_CADA_RANK_DE_EXERCICIO) {
    if (minutos >= faixa.minutos) rank = faixa.rank;
  }
  return rank;
}

/** Próximo rank e quantos minutos faltam (null se já está no topo). */
export function proximoRank(minutos: number): { rank: ExerciseRank; faltamMinutos: number } | null {
  const proxima = MINUTOS_PARA_CADA_RANK_DE_EXERCICIO.find((f) => f.minutos > minutos);
  return proxima ? { rank: proxima.rank, faltamMinutos: proxima.minutos - minutos } : null;
}

export type LinhaDeRank = {
  name: string;
  segundos: number;
  minutos: number;
  rank: ExerciseRank;
  proximo: { rank: ExerciseRank; faltamMinutos: number } | null;
};

/** Ranks de todos os exercícios com tempo acumulado, do maior para o menor tempo. */
export function calcularRanks(segundosPorExercicio: Record<string, number>): LinhaDeRank[] {
  return Object.entries(segundosPorExercicio)
    .filter(([, segundos]) => segundos > 0)
    .map(([name, segundos]) => {
      const minutos = Math.round((segundos / 60) * 10) / 10;
      return { name, segundos, minutos, rank: rankPorMinutos(minutos), proximo: proximoRank(minutos) };
    })
    .sort((a, b) => b.segundos - a.segundos);
}
