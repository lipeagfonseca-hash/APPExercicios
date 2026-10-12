"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { beep } from "@/lib/beep";
import { exerciseGifUrl } from "@/lib/exerciseCatalog";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import UseProgramButton from "@/components/UseProgramButton";
import type { Program } from "@/lib/programs";

export type TodayExercise = {
  name: string;
  type: "STRENGTH" | "CARDIO";
  rounds: number;
  reps: number;
  mediaId: string | null;
};

type Props = {
  program: Program;
  exercises: TodayExercise[];
  exerciseRest: number;
  roundRest: number;
};

type State =
  | { phase: "idle" }
  | { phase: "work"; round: number; idx: number }
  | { phase: "rest"; round: number; idx: number; remaining: number; total: number }
  | { phase: "done" };

type Action =
  | { type: "start" }
  | { type: "finishSet" }
  | { type: "skipRest" }
  | { type: "tick" }
  | { type: "reset" };

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TodayProgram({ program, exercises, exerciseRest, roundRest }: Props) {
  const totalRounds = exercises[0]?.rounds ?? 3;
  const count = exercises.length;
  const [detailId, setDetailId] = useState<string | null>(null);

  const [state, dispatch] = useReducer((s: State, a: Action): State => {
    switch (a.type) {
      case "start":
        return { phase: "work", round: 0, idx: 0 };
      case "reset":
        return { phase: "idle" };
      case "finishSet": {
        if (s.phase !== "work") return s;
        const lastInRound = s.idx === count - 1;
        if (lastInRound && s.round === totalRounds - 1) return { phase: "done" };
        const next = lastInRound
          ? { round: s.round + 1, idx: 0, total: roundRest }
          : { round: s.round, idx: s.idx + 1, total: exerciseRest };
        return { phase: "rest", round: next.round, idx: next.idx, remaining: next.total, total: next.total };
      }
      case "skipRest":
        return s.phase === "rest" ? { phase: "work", round: s.round, idx: s.idx } : s;
      case "tick": {
        if (s.phase !== "rest") return s;
        if (s.remaining <= 1) return { phase: "work", round: s.round, idx: s.idx };
        return { ...s, remaining: s.remaining - 1 };
      }
    }
  }, { phase: "idle" } as State);

  // One interval for the whole rest phase.
  const resting = state.phase === "rest";
  useEffect(() => {
    if (!resting) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [resting]);

  // Audible cue when a rest ends or the circuit finishes (no state updates here).
  const previousPhase = useRef<State["phase"]>("idle");
  useEffect(() => {
    if (previousPhase.current === "rest" && state.phase === "work") beep(880);
    if (state.phase === "done" && previousPhase.current !== "done") beep(660);
    previousPhase.current = state.phase;
  }, [state.phase]);

  const activeIdx = state.phase === "work" || state.phase === "rest" ? state.idx : -1;
  const activeRound = state.phase === "work" || state.phase === "rest" ? state.round : 0;

  return (
    <section className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-5 shadow-[0_0_25px_rgba(0,210,255,0.12)]">
      {detailId && <ExerciseDetailModal id={detailId} onClose={() => setDetailId(null)} />}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono-label text-label-md uppercase tracking-wider text-primary">
            [PROGRAMA DO DIA]
          </span>
          <h2 className="font-display text-headline-md text-on-surface">{program.name}</h2>
          <span className="font-mono-label text-label-sm text-on-surface-variant">
            {program.className} · RANK {program.difficulty} · {count} exercícios × {totalRounds} rounds
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 font-mono-label text-label-sm text-on-surface-variant">
          <span>DESCANSO: {exerciseRest}s ENTRE EXERCÍCIOS</span>
          <span>{roundRest}s ENTRE ROUNDS</span>
        </div>
      </div>

      <p className="mb-4 font-body text-body-sm text-on-surface-variant">{program.description}</p>

      {state.phase !== "idle" && (
        <div className="mb-4 rounded-lg border border-primary-container/30 bg-primary-container/10 p-3">
          {state.phase === "done" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-display text-headline-sm text-primary">
                CIRCUITO COMPLETO
              </span>
              <div className="flex flex-wrap gap-2">
                <UseProgramButton program={program} />
                <button
                  type="button"
                  onClick={() => dispatch({ type: "reset" })}
                  className="rounded-lg border border-primary-container/30 px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                  ROUND {state.round + 1}/{totalRounds} · EXERCÍCIO {state.idx + 1}/{count}
                </span>
                <div className="font-display text-headline-sm text-on-surface">
                  {state.phase === "rest" ? "Descanso" : exercises[state.idx].name}
                </div>
                {state.phase === "rest" && (
                  <span className="font-mono-label text-label-sm text-on-surface-variant">
                    A seguir: {exercises[state.idx].name}
                  </span>
                )}
                {state.phase === "work" && (
                  <span className="font-mono-label text-label-sm text-primary">
                    {exercises[state.idx].reps} repetições
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {state.phase === "rest" && (
                  <span
                    className="font-mono-label text-headline-md tabular-nums text-primary"
                    aria-live="off"
                  >
                    {formatClock(state.remaining)}
                  </span>
                )}
                {state.phase === "work" ? (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "finishSet" })}
                    className="rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)]"
                  >
                    Série concluída
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "skipRest" })}
                    className="rounded-lg border border-primary-container/40 px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-primary"
                  >
                    Pular descanso
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "reset" })}
                  className="font-mono-label text-label-sm text-error hover:underline"
                >
                  Parar
                </button>
              </div>
            </div>
          )}
          {state.phase === "rest" && (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full rounded-full bg-primary-container transition-[width] duration-1000 ease-linear"
                style={{ width: `${(state.remaining / state.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {exercises.map((ex, index) => {
          const active = index === activeIdx;
          return (
            <li
              key={ex.name}
              className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                active
                  ? "bg-primary-container/15 ring-1 ring-primary-container/50"
                  : "bg-surface-container/40"
              }`}
            >
              <button
                type="button"
                disabled={!ex.mediaId}
                onClick={() => ex.mediaId && setDetailId(ex.mediaId)}
                aria-label={`Ver detalhes: ${ex.name}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-surface-container-low"
              >
                {ex.mediaId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={exerciseGifUrl(ex.mediaId)}
                    alt=""
                    width={96}
                    height={96}
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-24 w-24 object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                    fitness_center
                  </span>
                )}
              </button>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono-label text-label-sm text-on-surface-variant">
                  {String(index + 1).padStart(2, "0")} · {ex.type === "CARDIO" ? "CARDIO" : "FORÇA"}
                </span>
                <span className="font-body text-body-md font-semibold text-on-surface">{ex.name}</span>
                <span className="font-mono-label text-label-sm text-primary">
                  {ex.rounds} × {ex.reps} reps
                </span>
                {active && activeRound >= 0 && state.phase !== "idle" && state.phase !== "done" && (
                  <span className="font-mono-label text-label-sm text-tertiary">
                    {state.phase === "work" ? "AGORA" : "PRÓXIMO"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {state.phase === "idle" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => dispatch({ type: "start" })}
            className="rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)]"
          >
            Iniciar circuito
          </button>
          <span className="font-mono-label text-label-sm text-on-surface-variant">
            Cronometra os descansos e avisa com um beep.
          </span>
        </div>
      )}
    </section>
  );
}
