// ============================================================================
// CONFIGURAÇÃO DOS TREINOS (A, B, C, D)
// ----------------------------------------------------------------------------
// FASE 1 (provisória): A–D apontam para os programas de baixo impacto que já
// existem em src/lib/programs.ts. Na Fase 2 este arquivo passa a definir os
// treinos por tempo (A = inferiores, B = superiores + core, C = cardio,
// D = core + mobilidade).
//
// O build FALHA se algum treino passar de DURACAO_MAXIMA_SEGUNDOS.
// ============================================================================

import { PROGRAMS, type Program } from "../lib/programs.ts";
import { buildSegments, totalSeconds } from "../lib/timedProgram.ts";
import { SEQUENCIA_DA_ROTACAO } from "./rotacao.ts";
import { validarSequencia } from "../lib/rotacao.ts";

/** Limite de cada treino, contando preparo, trocas e pausas ativas (10 minutos). */
export const DURACAO_MAXIMA_SEGUNDOS = 600;

/** Programa de cada treino da rotação. */
const PROGRAMA_DE_CADA_TREINO: Record<string, string> = {
  A: "low-b", // Pernas Seguras
  B: "low-c", // Tronco e Postura
  C: "low-d", // Cardio Suave
  D: "low-a", // Despertar (provisório até o treino D da Fase 2)
};

function buscarPrograma(idDoPrograma: string): Program {
  const programa = PROGRAMS.find((p) => p.id === idDoPrograma);
  if (!programa) throw new Error(`Programa "${idDoPrograma}" não existe em programs.ts.`);
  return programa;
}

export const TREINOS: Record<string, Program> = Object.fromEntries(
  Object.entries(PROGRAMA_DE_CADA_TREINO).map(([id, idDoPrograma]) => [id, buscarPrograma(idDoPrograma)]),
);

export function treinoPorId(id: string): Program {
  const treino = TREINOS[id];
  if (!treino) throw new Error(`Treino "${id}" não existe na configuração.`);
  return treino;
}

/** Duração total do treino em segundos (preparo + esforço + trocas + pausas ativas). */
export function duracaoTotalEmSegundos(id: string): number {
  return totalSeconds(buildSegments(treinoPorId(id)));
}

// --- Validações executadas ao carregar o módulo (falham o build se algo estiver errado) ---
validarSequencia(SEQUENCIA_DA_ROTACAO, Object.keys(TREINOS));
for (const id of Object.keys(TREINOS)) {
  const segundos = duracaoTotalEmSegundos(id);
  if (segundos > DURACAO_MAXIMA_SEGUNDOS) {
    throw new Error(
      `O treino ${id} dura ${segundos}s e passa do limite de ${DURACAO_MAXIMA_SEGUNDOS}s. ` +
        "Reduza o tempo de esforço, as trocas, as pausas ou o número de blocos.",
    );
  }
}
