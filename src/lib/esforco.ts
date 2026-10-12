// ============================================================================
// ESFORÇO ACUMULADO (regras puras)
// ----------------------------------------------------------------------------
// Converte "quantas vezes o usuário concluiu cada treino" em "quantos segundos
// de esforço em cada exercício". É a base do rank por exercício e dos atributos.
//
// Ex.: Treino A concluído 3 vezes, com "Agachamento com apoio" 2× por treino
// (30 s cada) → 2 × 30 × 3 = 180 s.
//
// Os dados vêm da configuração ATUAL dos treinos: se um treino for editado, o
// histórico passa a ser interpretado com a versão nova.
// ============================================================================

import type { Program } from "./programs.ts";
import { buildSegments } from "./timedProgram.ts";

export type Esforco = {
  /** Segundos de esforço por exercício (sem contar as pausas ativas). */
  porExercicio: Record<string, number>;
  /** Segundos de pausa ativa (marcha estática) acumulados. */
  pausaSegundos: number;
  /** Segundos de esforço somados (exercícios + pausas ativas). */
  totalSegundos: number;
};

/** Esforço de UMA execução do treino. */
export function esforcoDeUmTreino(programa: Program): Esforco {
  const porExercicio: Record<string, number> = {};
  let pausaSegundos = 0;
  for (const segmento of buildSegments(programa)) {
    if (segmento.kind === "work") {
      porExercicio[segmento.name] = (porExercicio[segmento.name] ?? 0) + segmento.seconds;
    } else if (segmento.kind === "pause") {
      pausaSegundos += segmento.seconds;
    }
  }
  const totalSegundos = Object.values(porExercicio).reduce((a, b) => a + b, 0) + pausaSegundos;
  return { porExercicio, pausaSegundos, totalSegundos };
}

/** Soma o esforço de todas as execuções: `{ A: 3, B: 2 }` = A feito 3 vezes e B 2 vezes. */
export function somarEsforco(
  execucoesPorTreino: Record<string, number>,
  programas: Record<string, Program>,
): Esforco {
  const total: Esforco = { porExercicio: {}, pausaSegundos: 0, totalSegundos: 0 };
  for (const [idDoTreino, vezes] of Object.entries(execucoesPorTreino)) {
    const programa = programas[idDoTreino];
    if (!programa || vezes <= 0) continue; // treino que saiu da configuração é ignorado
    const um = esforcoDeUmTreino(programa);
    for (const [nome, segundos] of Object.entries(um.porExercicio)) {
      total.porExercicio[nome] = (total.porExercicio[nome] ?? 0) + segundos * vezes;
    }
    total.pausaSegundos += um.pausaSegundos * vezes;
    total.totalSegundos += um.totalSegundos * vezes;
  }
  return total;
}
