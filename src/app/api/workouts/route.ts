import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyGainsForExercises } from "@/lib/gains";

const workoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["STRENGTH", "CARDIO"]).default("STRENGTH"),
        sets: z
          .array(
            z.object({
              reps: z.number().int().positive(),
              weightKg: z.number().nonnegative().nullable().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const workouts = await prisma.workout.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json({ workouts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = workoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, date, exercises } = parsed.data;

  const workout = await prisma.workout.create({
    data: {
      name,
      date: new Date(date),
      userId: session.user.id,
      exercises: {
        create: exercises.map((exercise, exerciseIndex) => ({
          name: exercise.name,
          type: exercise.type,
          order: exerciseIndex,
          sets: {
            create: exercise.sets.map((set, setIndex) => ({
              reps: set.reps,
              weightKg: set.weightKg ?? null,
              order: setIndex,
            })),
          },
        })),
      },
    },
  });

  const system = await applyGainsForExercises(
    session.user.id,
    exercises,
    (result) => ({
      tag: "SISTEMA: TREINO",
      message: `Treino "${name}" registrado. +${result.xpGained} XP.`,
    }),
  );

  return NextResponse.json({ workout, system }, { status: 201 });
}
