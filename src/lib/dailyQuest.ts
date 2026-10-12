import { prisma } from "@/lib/prisma";

export const DAILY_QUEST_WORKOUT_NAME = "Missão Diária";

export const QUEST_OBJECTIVES = [
  {
    key: "pushup",
    exerciseName: "Flexão",
    label: "Flexões (Push-ups)",
    description: "Série contínua executada com sucesso",
    type: "STRENGTH" as const,
    target: 100,
    unit: "reps",
  },
  {
    key: "situp",
    exerciseName: "Abdominal",
    label: "Abdominais (Sit-ups)",
    description: "Contrações isométricas de alta intensidade",
    type: "STRENGTH" as const,
    target: 100,
    unit: "reps",
  },
  {
    key: "squat",
    exerciseName: "Agachamento livre",
    label: "Agachamentos (Squats)",
    description: "Carga dinâmica nos membros inferiores",
    type: "STRENGTH" as const,
    target: 100,
    unit: "reps",
  },
  {
    key: "run",
    exerciseName: "Corrida",
    label: "Corrida (Running)",
    description: "Deslocamento contínuo em perímetro urbano",
    type: "CARDIO" as const,
    target: 10,
    unit: "km",
  },
] as const;

export type QuestKey = (typeof QUEST_OBJECTIVES)[number]["key"];

export function todayUtcMidnight(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function secondsUntilMidnightUtc(now: Date = new Date()): number {
  const tomorrow = new Date(todayUtcMidnight(now).getTime() + 86_400_000);
  return Math.max(0, Math.round((tomorrow.getTime() - now.getTime()) / 1000));
}

export async function getTodayQuestWorkout(userId: string) {
  return prisma.workout.findFirst({
    where: {
      userId,
      name: DAILY_QUEST_WORKOUT_NAME,
      date: todayUtcMidnight(),
    },
    include: { exercises: { include: { sets: true } } },
  });
}

export type ObjectiveProgress = (typeof QUEST_OBJECTIVES)[number] & {
  current: number;
  pct: number;
  complete: boolean;
};

export function computeObjectiveProgress(
  workout: Awaited<ReturnType<typeof getTodayQuestWorkout>>,
): ObjectiveProgress[] {
  return QUEST_OBJECTIVES.map((objective) => {
    const exercise = workout?.exercises.find(
      (e) => e.name === objective.exerciseName,
    );
    const current = exercise
      ? exercise.sets.reduce((sum, s) => sum + s.reps, 0)
      : 0;
    const clamped = Math.min(current, objective.target);
    return {
      ...objective,
      current: clamped,
      pct: Math.round((clamped / objective.target) * 100),
      complete: clamped >= objective.target,
    };
  });
}

export async function getOrCreateTodayQuestWorkout(userId: string) {
  const existing = await getTodayQuestWorkout(userId);
  if (existing) return existing;

  return prisma.workout.create({
    data: {
      userId,
      name: DAILY_QUEST_WORKOUT_NAME,
      date: todayUtcMidnight(),
    },
    include: { exercises: { include: { sets: true } } },
  });
}
