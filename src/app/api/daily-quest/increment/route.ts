import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyGainsForExercises } from "@/lib/gains";
import {
  QUEST_OBJECTIVES,
  computeObjectiveProgress,
  getOrCreateTodayQuestWorkout,
} from "@/lib/dailyQuest";

const bodySchema = z.object({
  key: z.enum(["pushup", "situp", "squat", "run"]),
  amount: z.number().positive().max(1000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { key, amount } = parsed.data;
  const objective = QUEST_OBJECTIVES.find((o) => o.key === key)!;
  const userId = session.user.id;

  const workout = await getOrCreateTodayQuestWorkout(userId);
  const progressBefore = computeObjectiveProgress(workout);
  const current = progressBefore.find((o) => o.key === key)!;

  if (current.complete) {
    return NextResponse.json({ error: "Objetivo já concluído." }, { status: 400 });
  }

  const addAmount = Math.min(amount, objective.target - current.current);

  let exercise = workout.exercises.find((e) => e.name === objective.exerciseName);
  if (!exercise) {
    exercise = await prisma.workoutExercise.create({
      data: {
        workoutId: workout.id,
        name: objective.exerciseName,
        type: objective.type,
        order: QUEST_OBJECTIVES.findIndex((o) => o.key === key),
      },
      include: { sets: true },
    });
  }

  await prisma.setEntry.create({
    data: {
      workoutExerciseId: exercise.id,
      reps: addAmount,
      weightKg: null,
      order: exercise.sets.length,
    },
  });

  const newTotal = current.current + addAmount;
  const justCompleted = newTotal >= objective.target;

  const system = await applyGainsForExercises(
    userId,
    [{ type: objective.type, sets: [{ reps: addAmount, weightKg: null }] }],
    (result) => ({
      tag: `SISTEMA: ${objective.label.split(" ")[0].toUpperCase()}`,
      message: `+${addAmount} ${objective.unit} registrados. Total: ${newTotal}/${objective.target}. +${result.xpGained} XP.`,
    }),
  );

  if (justCompleted) {
    const profile = await prisma.playerProfile.findUnique({ where: { userId } });
    if (profile) {
      await prisma.systemLog.create({
        data: {
          profileId: profile.id,
          tag: "SISTEMA: CONQUISTA",
          message: `Objetivo de ${objective.label} finalizado com êxito!`,
        },
      });
    }
  }

  const updatedWorkout = await getOrCreateTodayQuestWorkout(userId);
  const progress = computeObjectiveProgress(updatedWorkout);

  return NextResponse.json({ progress, system });
}
