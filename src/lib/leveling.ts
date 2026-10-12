export const RANKS = ["E", "D", "C", "B", "A", "S"] as const;
export type Rank = (typeof RANKS)[number];

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function rankFromLevel(level: number): Rank {
  if (level >= 50) return "S";
  if (level >= 40) return "A";
  if (level >= 30) return "B";
  if (level >= 20) return "C";
  if (level >= 10) return "D";
  return "E";
}

export function applyXp(
  currentLevel: number,
  currentXp: number,
  gained: number,
): { level: number; xp: number; levelsGained: number } {
  let level = currentLevel;
  let xp = currentXp + gained;
  let levelsGained = 0;

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    levelsGained += 1;
  }

  return { level, xp, levelsGained };
}

type SetInput = { reps: number; weightKg?: number | null };
type ExerciseInput = { type: "STRENGTH" | "CARDIO"; sets: SetInput[] };

export type WorkoutGains = {
  xp: number;
  strGain: number;
  vitGain: number;
  agiGain: number;
  endGain: number;
};

export function computeWorkoutGains(exercises: ExerciseInput[]): WorkoutGains {
  let xp = 10; // base quest completion reward
  let strGain = 0;
  let vitGain = 1; // flat vitality for showing up
  let agiGain = 0;
  let endGain = 0;

  for (const exercise of exercises) {
    const totalReps = exercise.sets.reduce((sum, s) => sum + s.reps, 0);
    const totalVolume = exercise.sets.reduce(
      (sum, s) => sum + s.reps * (s.weightKg ?? 0),
      0,
    );

    if (exercise.type === "CARDIO") {
      agiGain += Math.ceil(totalReps / 5);
      vitGain += Math.ceil(totalReps / 10);
      xp += Math.round(totalReps * 0.5);
    } else {
      strGain += Math.ceil(totalVolume / 50);
      endGain += Math.ceil(totalReps / 5);
      xp += Math.round(totalVolume / 5 + totalReps);
    }
  }

  return { xp, strGain, vitGain, agiGain, endGain };
}

function toUtcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function daysSince(lastActivityDate: Date | null, now: Date): number | null {
  if (!lastActivityDate) return null;
  const today = toUtcDateOnly(now);
  const last = toUtcDateOnly(lastActivityDate);
  return Math.round((today.getTime() - last.getTime()) / 86_400_000);
}

export type ActivityOutcome = {
  streakDays: number;
  xpMultiplier: number;
  penaltyCleared: boolean;
  isFirstActivityToday: boolean;
};

export function resolveDailyActivity(
  previousStreak: number,
  lastActivityDate: Date | null,
  now: Date,
): ActivityOutcome {
  const diff = daysSince(lastActivityDate, now);

  if (diff === 0) {
    return {
      streakDays: previousStreak,
      xpMultiplier: 1,
      penaltyCleared: false,
      isFirstActivityToday: false,
    };
  }

  if (diff === null || diff === 1) {
    return {
      streakDays: previousStreak + 1,
      xpMultiplier: 1,
      penaltyCleared: false,
      isFirstActivityToday: true,
    };
  }

  return {
    streakDays: 1,
    xpMultiplier: 0.5,
    penaltyCleared: true,
    isFirstActivityToday: true,
  };
}

export function isInPenaltyZone(
  lastActivityDate: Date | null,
  now: Date,
): boolean {
  const diff = daysSince(lastActivityDate, now);
  return diff !== null && diff >= 2;
}

export function missedDays(lastActivityDate: Date | null, now: Date): number {
  const diff = daysSince(lastActivityDate, now);
  if (diff === null || diff < 2) return 0;
  return diff - 1;
}
