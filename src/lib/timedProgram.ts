import type { Program } from "./programs.ts";

export type Segment = {
  kind: "ready" | "work" | "transition" | "pause";
  seconds: number;
  /** Exercício mostrado durante este segmento. */
  name: string;
  /** O que vem a seguir (mostrado nas trocas e pausas). */
  nextName: string | null;
  block: number | null;
};

/**
 * Achata um treino por tempo na sequência que o cronômetro percorre:
 * preparo → (esforço, troca)* por bloco, com uma pausa ativa entre blocos.
 * Não há troca depois do último exercício de um bloco (a pausa já é o descanso)
 * nem depois do último exercício do treino.
 *
 * Ex.: blocos [[a,b],[c]] → ready, work a, transition, work b, pause, work c.
 */
export function buildSegments(program: Program): Segment[] {
  const plan = program.timed;
  if (!plan) return [];

  const segments: Segment[] = [];
  const firstName = plan.blocks[0]?.[0] ?? null;
  segments.push({ kind: "ready", seconds: plan.prepareSeconds, name: "Prepare-se", nextName: firstName, block: null });

  plan.blocks.forEach((block, blockIndex) => {
    block.forEach((exercise, exerciseIndex) => {
      segments.push({
        kind: "work",
        seconds: plan.secondsByExercise?.[exercise] ?? plan.workSeconds,
        name: exercise,
        nextName: null,
        block: blockIndex,
      });
      const isLastInBlock = exerciseIndex === block.length - 1;
      if (!isLastInBlock) {
        segments.push({
          kind: "transition",
          seconds: plan.transitionSeconds,
          name: "Troca",
          nextName: block[exerciseIndex + 1],
          block: blockIndex,
        });
      }
    });

    const nextBlock = plan.blocks[blockIndex + 1];
    if (nextBlock) {
      segments.push({
        kind: "pause",
        seconds: plan.pauseSeconds,
        name: plan.pauseExercise,
        nextName: nextBlock[0],
        block: blockIndex,
      });
    }
  });

  return segments;
}

export function totalSeconds(segments: Segment[]) {
  return segments.reduce((sum, s) => sum + s.seconds, 0);
}

export function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
