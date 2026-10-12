"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SystemNotification, { SystemResult } from "@/components/SystemNotification";
import { PROGRAM_STORAGE_KEY } from "@/components/UseProgramButton";
import { Program } from "@/lib/programs";
import ExercisePicker from "@/components/ExercisePicker";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import type { ExerciseSummary } from "@/lib/exerciseCatalog";

type SetRow = { reps: string; weightKg: string };
type ExerciseType = "STRENGTH" | "CARDIO";
type ExerciseRow = {
  name: string;
  type: ExerciseType;
  sets: SetRow[];
  exerciseId?: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyExercise(): ExerciseRow {
  return { name: "", type: "STRENGTH", sets: [{ reps: "", weightKg: "" }] };
}

function programToExercises(program: Program): ExerciseRow[] {
  return program.exercises.map((ex) => ({
    name: ex.name,
    type: ex.type,
    sets: ex.sets.map((s) => ({
      reps: String(s.reps),
      weightKg: s.weightKg != null ? String(s.weightKg) : "",
    })),
  }));
}

export default function WorkoutForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayIso());
  const [exercises, setExercises] = useState<ExerciseRow[]>([emptyExercise()]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [systemResult, setSystemResult] = useState<SystemResult | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(PROGRAM_STORAGE_KEY);
    if (!stored) return;
    sessionStorage.removeItem(PROGRAM_STORAGE_KEY);
    try {
      const program = JSON.parse(stored) as Program;
      // sessionStorage is only readable on the client; reading it in the
      // initial state would cause a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(program.name);
      setExercises(programToExercises(program));
    } catch {
      // ignore malformed storage
    }
  }, []);

  function updateExerciseName(index: number, value: string) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === index ? { ...ex, name: value, exerciseId: undefined } : ex,
      ),
    );
  }

  function pickExercise(index: number, item: ExerciseSummary) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === index
          ? { ...ex, name: item.name, type: item.type, exerciseId: item.id }
          : ex,
      ),
    );
  }

  function updateExerciseType(index: number, value: ExerciseType) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, type: value } : ex)),
    );
  }

  function updateSet(
    exerciseIndex: number,
    setIndex: number,
    field: keyof SetRow,
    value: string,
  ) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, [field]: value } : s,
              ),
            }
          : ex,
      ),
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function addSet(exerciseIndex: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, sets: [...ex.sets, { reps: "", weightKg: "" }] }
          : ex,
      ),
    );
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exerciseIndex
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      date: new Date(date).toISOString(),
      exercises: exercises
        .filter((ex) => ex.name.trim().length > 0)
        .map((ex) => ({
          name: ex.name.trim(),
          type: ex.type,
          sets: ex.sets
            .filter((s) => s.reps.trim().length > 0)
            .map((s) => ({
              reps: Number(s.reps),
              weightKg: s.weightKg.trim() ? Number(s.weightKg) : null,
            })),
        }))
        .filter((ex) => ex.sets.length > 0),
    };

    if (!payload.name.trim() || payload.exercises.length === 0) {
      setError("Informe o nome do treino e pelo menos um exercício com uma série.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!res.ok) {
      setError("Erro ao salvar o treino.");
      return;
    }

    const data = await res.json();

    setName("");
    setDate(todayIso());
    setExercises([emptyExercise()]);

    if (data.system) {
      setSystemResult(data.system);
    } else {
      router.refresh();
    }
  }

  function closeSystemNotification() {
    setSystemResult(null);
    router.refresh();
  }

  return (
    <>
      {detailId && (
        <ExerciseDetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}
      {systemResult && (
        <SystemNotification result={systemResult} onClose={closeSystemNotification} />
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4"
      >
        <h2 className="font-display text-headline-sm uppercase tracking-wider text-primary">
          Treino Livre
        </h2>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">Nome do treino</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Peito e tríceps"
              className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {exercises.map((exercise, exerciseIndex) => (
            <div
              key={exerciseIndex}
              className="rounded-lg border border-primary-container/10 bg-surface-container/40 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <ExercisePicker
                  value={exercise.name}
                  exerciseId={exercise.exerciseId}
                  onTextChange={(value) => updateExerciseName(exerciseIndex, value)}
                  onPick={(item) => pickExercise(exerciseIndex, item)}
                  onOpenDetail={setDetailId}
                />
                <select
                  value={exercise.type}
                  onChange={(e) =>
                    updateExerciseType(
                      exerciseIndex,
                      e.target.value as ExerciseType,
                    )
                  }
                  className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-2 py-2 text-sm"
                >
                  <option value="STRENGTH">Força</option>
                  <option value="CARDIO">Cardio</option>
                </select>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(exerciseIndex)}
                    className="font-mono-label text-label-sm text-error hover:underline"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center gap-2">
                    <span className="w-14 font-mono-label text-label-sm text-on-surface-variant">
                      Série {setIndex + 1}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exerciseIndex, setIndex, "reps", e.target.value)
                      }
                      placeholder="reps"
                      className="w-20 rounded-lg border border-primary-container/20 bg-surface-container-lowest px-2 py-1"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={set.weightKg}
                      onChange={(e) =>
                        updateSet(
                          exerciseIndex,
                          setIndex,
                          "weightKg",
                          e.target.value,
                        )
                      }
                      placeholder="kg"
                      className="w-20 rounded-lg border border-primary-container/20 bg-surface-container-lowest px-2 py-1"
                    />
                    {exercise.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(exerciseIndex, setIndex)}
                        className="font-mono-label text-label-sm text-error hover:underline"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSet(exerciseIndex)}
                  className="self-start font-mono-label text-label-sm text-primary hover:underline"
                >
                  + série
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExercise}
            className="self-start font-mono-label text-label-sm text-primary hover:underline"
          >
            + exercício
          </button>
        </div>

        {error && (
          <p className="font-mono-label text-label-sm text-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar treino"}
        </button>
      </form>
    </>
  );
}
