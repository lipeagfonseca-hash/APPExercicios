export const EXERCISE_RANKS = ["E", "D", "C", "B", "A", "S", "SS", "SSS"] as const;
export type ExerciseRank = (typeof EXERCISE_RANKS)[number];

export function epley1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export function rankFromGrowth(growth: number): ExerciseRank {
  if (growth >= 3.5) return "SSS";
  if (growth >= 2.5) return "SS";
  if (growth >= 2.0) return "S";
  if (growth >= 1.7) return "A";
  if (growth >= 1.45) return "B";
  if (growth >= 1.25) return "C";
  if (growth >= 1.1) return "D";
  return "E";
}

type SetData = { reps: number; weightKg: number | null };
type ExerciseData = {
  name: string;
  type: "STRENGTH" | "CARDIO";
  sets: SetData[];
};
type WorkoutData = { date: Date; exercises: ExerciseData[] };

export type ExerciseRankRow = {
  name: string;
  type: "STRENGTH" | "CARDIO";
  rank: ExerciseRank;
  growth: number;
  bestWeight: number | null;
  bestReps: number;
};

function sessionBest(exercise: ExerciseData): {
  score: number;
  weight: number | null;
  reps: number;
} {
  const hasWeight = exercise.sets.some((s) => (s.weightKg ?? 0) > 0);

  if (exercise.type === "CARDIO" || !hasWeight) {
    // Bodyweight or distance-based: total reps across the session is the
    // meaningful metric (e.g. 10x10 push-ups adding up to 100 reps).
    const totalReps = exercise.sets.reduce((sum, s) => sum + s.reps, 0);
    return { score: totalReps, weight: null, reps: totalReps };
  }

  let best = { score: 0, weight: null as number | null, reps: 0 };
  for (const set of exercise.sets) {
    const weight = set.weightKg ?? 0;
    const score = weight > 0 ? epley1RM(weight, set.reps) : set.reps;
    if (score > best.score) {
      best = { score, weight: set.weightKg ?? null, reps: set.reps };
    }
  }
  return best;
}

export function computeExerciseRanks(workouts: WorkoutData[]): ExerciseRankRow[] {
  const sorted = [...workouts].sort((a, b) => a.date.getTime() - b.date.getTime());

  const map = new Map<
    string,
    {
      displayName: string;
      type: "STRENGTH" | "CARDIO";
      baseline: number;
      best: number;
      bestWeight: number | null;
      bestReps: number;
    }
  >();

  for (const workout of sorted) {
    for (const exercise of workout.exercises) {
      const key = exercise.name.trim().toLowerCase();
      const result = sessionBest(exercise);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          displayName: exercise.name,
          type: exercise.type,
          baseline: result.score,
          best: result.score,
          bestWeight: result.weight,
          bestReps: result.reps,
        });
      } else if (result.score > existing.best) {
        existing.best = result.score;
        existing.bestWeight = result.weight;
        existing.bestReps = result.reps;
      }
    }
  }

  return Array.from(map.values())
    .map((v) => {
      const growth = v.baseline > 0 ? v.best / v.baseline : 1;
      return {
        name: v.displayName,
        type: v.type,
        rank: rankFromGrowth(growth),
        growth,
        bestWeight: v.bestWeight,
        bestReps: v.bestReps,
      };
    })
    .sort((a, b) => b.growth - a.growth);
}
