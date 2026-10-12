import type { Program } from "@/lib/programs";

export type Segment = {
  kind: "ready" | "work" | "transition" | "pause";
  seconds: number;
  /** Exercise shown during this segment. */
  name: string;
  /** What comes next (shown during transitions and pauses). */
  nextName: string | null;
  block: number | null;
};

export const READY_SECONDS = 5;

/**
 * Flattens a timed program into the sequence the timer walks through:
 * ready -> (work, transition)* per block, with an active pause between blocks.
 * No transition after the last exercise of a block (the pause is the rest) or
 * of the whole workout.
 */
export function buildSegments(program: Program): Segment[] {
  const plan = program.timed;
  if (!plan) return [];

  const segments: Segment[] = [];
  const firstName = plan.blocks[0]?.[0] ?? null;
  segments.push({ kind: "ready", seconds: READY_SECONDS, name: "Prepare-se", nextName: firstName, block: null });

  plan.blocks.forEach((block, blockIndex) => {
    block.forEach((exercise, exerciseIndex) => {
      segments.push({ kind: "work", seconds: plan.workSeconds, name: exercise, nextName: null, block: blockIndex });
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
