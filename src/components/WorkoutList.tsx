"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SetEntry = { id: string; reps: number; weightKg: number | null };
type WorkoutExercise = { id: string; name: string; sets: SetEntry[] };
type Workout = {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
};

export default function WorkoutList({ workouts }: { workouts: Workout[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  if (workouts.length === 0) {
    return (
      <p className="font-body text-body-sm text-on-surface-variant">
        Nenhum treino registrado ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-display text-headline-sm text-on-surface">
                {workout.name}
              </h3>
              <p className="font-mono-label text-label-sm text-on-surface-variant">
                {new Date(workout.date).toLocaleDateString("pt-BR", {
                  timeZone: "UTC",
                })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(workout.id)}
              disabled={deletingId === workout.id}
              className="font-mono-label text-label-sm text-error hover:underline disabled:opacity-50"
            >
              {deletingId === workout.id ? "Excluindo..." : "Excluir"}
            </button>
          </div>
          <ul className="flex flex-col gap-1 font-body text-body-sm text-on-surface-variant">
            {workout.exercises.map((exercise) => (
              <li key={exercise.id}>
                <span className="font-medium text-on-surface">{exercise.name}:</span>{" "}
                {exercise.sets
                  .map(
                    (set) =>
                      `${set.reps}x${set.weightKg != null ? `${set.weightKg}kg` : "-"}`,
                  )
                  .join(", ")}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
