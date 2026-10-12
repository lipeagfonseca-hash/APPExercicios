"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { beep } from "@/lib/beep";
import { exerciseGifUrl } from "@/lib/exerciseCatalog";
import { PROGRAM_EXERCISE_MEDIA } from "@/lib/programMedia";
import { buildSegments, formatClock, totalSeconds } from "@/lib/timedProgram";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import type { Program } from "@/lib/programs";

type State =
  | { status: "idle" }
  | { status: "running" | "paused"; index: number; remaining: number }
  | { status: "done" };

type Action =
  | { type: "start" }
  | { type: "toggle" }
  | { type: "tick" }
  | { type: "skip" }
  | { type: "reset" };

function Gif({ name, size, eager }: { name: string; size: number; eager?: boolean }) {
  const id = PROGRAM_EXERCISE_MEDIA[name];
  if (!id) {
    return (
      <span
        className="flex items-center justify-center rounded-md bg-surface-container-low"
        style={{ width: size, height: size }}
      >
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant">fitness_center</span>
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={exerciseGifUrl(id)}
      alt=""
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className="rounded-md bg-surface-container-low object-cover"
      style={{ width: size, height: size }}
    />
  );
}

type ResultadoDaConclusao = {
  xpGanho: number;
  subiuDeNivel: boolean;
  nivel: number;
  sequenciaAtual: number;
};

// Modo missão: o treino do dia é decidido pelo servidor. Aqui só se executa o
// cronômetro; o início e a conclusão são registrados (e validados) no servidor.
export default function TimedProgram({ program, rotulo }: { program: Program; rotulo: string }) {
  const router = useRouter();
  const plan = program.timed!;
  const [erroDoServidor, setErroDoServidor] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDaConclusao | null>(null);
  const conclusaoEnviada = useRef(false);
  const segments = useMemo(() => buildSegments(program), [program]);
  const total = totalSeconds(segments);
  const [detailName, setDetailName] = useState<string | null>(null);

  const advance = (s: { status: "running" | "paused"; index: number }): State => {
    const next = s.index + 1;
    if (next >= segments.length) return { status: "done" };
    return { status: s.status, index: next, remaining: segments[next].seconds };
  };

  const [state, dispatch] = useReducer((s: State, a: Action): State => {
    switch (a.type) {
      case "start":
        return { status: "running", index: 0, remaining: segments[0].seconds };
      case "reset":
        return { status: "idle" };
      case "toggle":
        if (s.status === "running") return { ...s, status: "paused" };
        if (s.status === "paused") return { ...s, status: "running" };
        return s;
      case "tick":
        if (s.status !== "running") return s;
        if (s.remaining > 1) return { ...s, remaining: s.remaining - 1 };
        return advance(s);
      case "skip":
        return s.status === "running" || s.status === "paused" ? advance(s) : s;
    }
  }, { status: "idle" } as State);

  const running = state.status === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => clearInterval(timer);
  }, [running]);

  // Audio cues (no state updates): a beep on every segment change, short ticks for the last 3 seconds.
  const lastIndex = useRef(-1);
  const index = state.status === "running" || state.status === "paused" ? state.index : -1;
  const remaining = state.status === "running" || state.status === "paused" ? state.remaining : 0;
  useEffect(() => {
    if (index >= 0 && index !== lastIndex.current && lastIndex.current !== -1) {
      beep(segments[index].kind === "work" ? 880 : 520);
    }
    lastIndex.current = index;
  }, [index, segments]);
  useEffect(() => {
    if (running && remaining > 0 && remaining <= 3 && segments[index]?.kind !== "ready") beep(440);
  }, [running, remaining, index, segments]);
  useEffect(() => {
    if (state.status === "done") beep(660);
  }, [state.status]);

  // Ao terminar o cronômetro, pede ao servidor para concluir (uma única vez por execução).
  useEffect(() => {
    if (state.status !== "done" || conclusaoEnviada.current) return;
    conclusaoEnviada.current = true;
    fetch("/api/treino-do-dia/concluir", { method: "POST" })
      .then(async (res) => {
        const dados = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErroDoServidor(dados.error ?? "Não foi possível concluir o treino.");
          return;
        }
        setResultado(dados);
        router.refresh();
      })
      .catch(() => setErroDoServidor("Sem conexão. Tente concluir novamente."));
  }, [state.status, router]);

  async function iniciarTreino() {
    setErroDoServidor(null);
    setIniciando(true);
    try {
      const res = await fetch("/api/treino-do-dia/iniciar", { method: "POST" });
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}));
        setErroDoServidor(dados.error ?? "Não foi possível iniciar o treino.");
        return;
      }
      conclusaoEnviada.current = false;
      dispatch({ type: "start" });
    } catch {
      setErroDoServidor("Sem conexão. Tente novamente.");
    } finally {
      setIniciando(false);
    }
  }

  const current = index >= 0 ? segments[index] : null;
  const elapsedBefore = index >= 0 ? segments.slice(0, index).reduce((n, s) => n + s.seconds, 0) : 0;
  const leftTotal = index >= 0 ? total - elapsedBefore - (current!.seconds - remaining) : total;
  const progress = index >= 0 ? ((total - leftTotal) / total) * 100 : state.status === "done" ? 100 : 0;
  const mediaForDetail = detailName ? PROGRAM_EXERCISE_MEDIA[detailName] : null;

  return (
    <section className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-5 shadow-[0_0_25px_rgba(0,210,255,0.12)]">
      {mediaForDetail && <ExerciseDetailModal id={mediaForDetail} onClose={() => setDetailName(null)} />}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono-label text-label-md uppercase tracking-wider text-primary">
            [TREINO DO DIA · {rotulo.toUpperCase()}]
          </span>
          <h2 className="font-display text-headline-md text-on-surface">{program.name}</h2>
          <span className="font-mono-label text-label-sm text-on-surface-variant">
            {program.className} · RANK {program.difficulty} · {formatClock(total)} no total
          </span>
        </div>
        <span className="rounded bg-primary-container/10 px-2 py-1 font-mono-label text-label-sm uppercase text-primary">
          Sem impacto
        </span>
      </div>

      <p className="mb-3 font-body text-body-sm text-on-surface-variant">{program.description}</p>
      <p className="mb-4 rounded-lg bg-surface-container/40 px-3 py-2 font-body text-body-sm text-on-surface-variant">
        Ritmo moderado: você deve conseguir conversar. Pare se sentir dor no peito, tontura ou falta de ar forte.
        Use uma parede ou cadeira firme como apoio.
      </p>

      {state.status !== "idle" && (
        <div className="mb-4 rounded-lg border border-primary-container/30 bg-primary-container/10 p-4">
          {state.status === "done" ? (
            <div className="flex flex-col gap-2">
              <span className="font-display text-headline-sm text-primary">TREINO COMPLETO</span>
              {resultado ? (
                <span className="font-mono-label text-label-md text-on-surface">
                  MISSÃO CONCLUÍDA · +{resultado.xpGanho} XP
                  {resultado.subiuDeNivel ? ` · NÍVEL ${resultado.nivel}!` : ""} · SEQUÊNCIA{" "}
                  {resultado.sequenciaAtual}
                </span>
              ) : erroDoServidor ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono-label text-label-sm text-error">{erroDoServidor}</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "reset" })}
                    className="rounded-lg border border-primary-container/30 px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                  >
                    Refazer
                  </button>
                </div>
              ) : (
                <span className="font-mono-label text-label-sm text-on-surface-variant">Registrando no sistema...</span>
              )}
            </div>
          ) : (
            current && (
              <div className="flex flex-wrap items-center gap-4">
                <Gif
                  name={current.kind === "transition" || current.kind === "ready" ? (current.nextName ?? "") : current.name}
                  size={120}
                  eager
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {current.kind === "pause"
                      ? "PAUSA ATIVA"
                      : current.kind === "ready"
                        ? "COMEÇA EM"
                        : current.kind === "transition"
                          ? "TROCA"
                          : `BLOCO ${(current.block ?? 0) + 1}/${plan.blocks.length}`}
                  </span>
                  <span className="font-display text-headline-sm text-on-surface">
                    {current.kind === "transition" || current.kind === "ready" ? current.nextName : current.name}
                  </span>
                  {current.kind === "pause" && (
                    <span className="font-body text-body-sm text-on-surface-variant">
                      Marche no lugar em ritmo leve, apoiado se precisar. Próximo: {current.nextName}
                    </span>
                  )}
                  {current.kind === "work" && (
                    <span className="font-mono-label text-label-sm text-primary">
                      {plan.workSeconds}s de esforço, sem pressa na técnica
                    </span>
                  )}
                  <span className="font-mono-label text-label-sm text-on-surface-variant">
                    Restam {formatClock(Math.max(leftTotal, 0))} de treino
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono-label text-headline-lg tabular-nums text-primary">
                    {formatClock(state.remaining)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "toggle" })}
                      className="rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container"
                    >
                      {state.status === "paused" ? "Retomar" : "Pausar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "skip" })}
                      className="rounded-lg border border-primary-container/40 px-3 py-2 font-mono-label text-label-md uppercase text-primary"
                    >
                      Pular
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "reset" })}
                      className="font-mono-label text-label-sm text-error hover:underline"
                    >
                      Parar
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full rounded-full bg-primary-container transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {plan.blocks.map((block, blockIndex) => (
          <div key={blockIndex} className="flex flex-col gap-2">
            <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
              Bloco {blockIndex + 1} · {block.length} exercícios × {plan.workSeconds}s
            </span>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {block.map((name, i) => {
                const active = current?.kind === "work" && current.block === blockIndex && current.name === name;
                return (
                  <li key={`${blockIndex}-${i}`}>
                    <button
                      type="button"
                      onClick={() => setDetailName(name)}
                      className={`flex w-full flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                        active ? "bg-primary-container/15 ring-1 ring-primary-container/50" : "bg-surface-container/40"
                      }`}
                    >
                      <Gif name={name} size={88} eager={blockIndex === 0} />
                      <span className="font-body text-body-sm font-semibold text-on-surface">{name}</span>
                      <span className="font-mono-label text-label-sm text-primary">{plan.workSeconds}s</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {blockIndex < plan.blocks.length - 1 && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary-container/30 bg-primary-container/5 p-2">
                <Gif name={plan.pauseExercise} size={56} />
                <div className="flex flex-col">
                  <span className="font-mono-label text-label-sm uppercase tracking-wider text-primary">
                    Pausa ativa · {formatClock(plan.pauseSeconds)}
                  </span>
                  <span className="font-body text-body-sm text-on-surface-variant">
                    {plan.pauseExercise}: marche no lugar, ritmo leve.
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {state.status === "idle" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={iniciarTreino}
            disabled={iniciando}
            className="rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] disabled:opacity-50"
          >
            {iniciando ? "Iniciando..." : "Iniciar treino"}
          </button>
          <span className="font-mono-label text-label-sm text-on-surface-variant">
            Cronômetro automático com beep a cada troca.
          </span>
          {erroDoServidor && (
            <span className="font-mono-label text-label-sm text-error">{erroDoServidor}</span>
          )}
        </div>
      )}
    </section>
  );
}
