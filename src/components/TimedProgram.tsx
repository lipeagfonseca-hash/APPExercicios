"use client";

// ============================================================================
// CRONÔMETRO DO TREINO
// ----------------------------------------------------------------------------
// Dois modos:
//  - "missao": é o treino do dia. Iniciar e concluir são registrados (e
//    validados) no servidor, que concede o XP. Veja src/lib/rotacaoServico.ts.
//  - "livre": rotina leve (alongamentos do descanso). Só cronometra; não grava
//    nada e não dá XP.
// Os exercícios, GIFs e instruções vêm da configuração (src/config).
// ============================================================================

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { beep } from "@/lib/beep";
import { exerciseGifUrl } from "@/lib/exerciseCatalog";
import { buildSegments, formatClock, totalSeconds } from "@/lib/timedProgram";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import type { DetalheDoExercicio } from "@/lib/montarTreino";
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

type ResultadoDaConclusao = {
  xpGanho: number;
  subiuDeNivel: boolean;
  nivel: number;
  sequenciaAtual: number;
};

type Props = {
  program: Program;
  /** Ex.: "Treino A". */
  rotulo: string;
  /** GIF, instrução curta e duração de cada exercício, indexados pelo nome. */
  detalhes: Record<string, DetalheDoExercicio>;
  modo?: "missao" | "livre";
};

function Gif({ gifId, size, eager }: { gifId?: string; size: number; eager?: boolean }) {
  if (!gifId) {
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
      src={exerciseGifUrl(gifId)}
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

export default function TimedProgram({ program, rotulo, detalhes, modo = "missao" }: Props) {
  const router = useRouter();
  const plan = program.timed!;
  const ehMissao = modo === "missao";

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

  // Sinais sonoros (sem atualizar estado): beep a cada troca e nos 3 últimos segundos.
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

  // Missão: ao terminar o cronômetro, pede ao servidor para concluir (uma única vez por execução).
  useEffect(() => {
    if (!ehMissao || state.status !== "done" || conclusaoEnviada.current) return;
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
  }, [ehMissao, state.status, router]);

  async function iniciarTreino() {
    setErroDoServidor(null);
    if (!ehMissao) {
      dispatch({ type: "start" });
      return;
    }
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
  const gifDoDetalhe = detailName ? detalhes[detailName]?.gifId : null;

  // Exercício que aparece em destaque: na troca e no preparo, o PRÓXIMO; senão o atual.
  const nomeEmDestaque = current
    ? current.kind === "transition" || current.kind === "ready"
      ? (current.nextName ?? "")
      : current.name
    : "";
  const instrucaoEmDestaque = detalhes[nomeEmDestaque]?.instrucao;

  return (
    <section className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-5 shadow-[0_0_25px_rgba(0,210,255,0.12)]">
      {gifDoDetalhe && (
        <ExerciseDetailModal
          id={gifDoDetalhe}
          instrucaoCurta={detalhes[detailName!]?.instrucao}
          onClose={() => setDetailName(null)}
        />
      )}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono-label text-label-md uppercase tracking-wider text-primary">
            {ehMissao ? `[TREINO DO DIA · ${rotulo.toUpperCase()}]` : `[${rotulo.toUpperCase()}]`}
          </span>
          <h2 className="font-display text-headline-md text-on-surface">{program.name}</h2>
          <span className="font-mono-label text-label-sm text-on-surface-variant">
            {program.className} · {formatClock(total)} no total
            {ehMissao ? ` · RANK ${program.difficulty}` : " · SEM XP"}
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
              <span className="font-display text-headline-sm text-primary">
                {ehMissao ? "TREINO COMPLETO" : "ALONGAMENTO COMPLETO"}
              </span>
              {!ehMissao ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono-label text-label-sm text-on-surface-variant">
                    Bom trabalho. Recuperação também é treino.
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "reset" })}
                    className="rounded-lg border border-primary-container/30 px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                  >
                    Refazer
                  </button>
                </div>
              ) : resultado ? (
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
                <Gif gifId={detalhes[nomeEmDestaque]?.gifId} size={120} eager />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {current.kind === "pause"
                      ? "PAUSA ATIVA"
                      : current.kind === "ready"
                        ? "COMEÇA EM"
                        : current.kind === "transition"
                          ? "TROCA · A SEGUIR"
                          : `BLOCO ${(current.block ?? 0) + 1}/${plan.blocks.length}`}
                  </span>
                  <span className="font-display text-headline-sm text-on-surface">{nomeEmDestaque}</span>
                  {instrucaoEmDestaque && (
                    <span className="font-body text-body-sm text-on-surface-variant">{instrucaoEmDestaque}</span>
                  )}
                  {current.kind === "pause" && (
                    <span className="font-mono-label text-label-sm text-primary">Próximo: {current.nextName}</span>
                  )}
                  <span className="font-mono-label text-label-sm text-on-surface-variant">
                    Restam {formatClock(Math.max(leftTotal, 0))} no total
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
            {plan.blocks.length > 1 && (
              <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                Bloco {blockIndex + 1} · {block.length} exercícios
              </span>
            )}
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {block.map((name, i) => {
                const active = current?.kind === "work" && current.block === blockIndex && current.name === name;
                const detalhe = detalhes[name];
                return (
                  <li key={`${blockIndex}-${i}`}>
                    <button
                      type="button"
                      onClick={() => setDetailName(name)}
                      className={`flex h-full w-full flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                        active ? "bg-primary-container/15 ring-1 ring-primary-container/50" : "bg-surface-container/40"
                      }`}
                    >
                      <Gif gifId={detalhe?.gifId} size={88} eager={blockIndex === 0} />
                      <span className="font-body text-body-sm font-semibold text-on-surface">{name}</span>
                      <span className="font-mono-label text-label-sm text-primary">
                        {detalhe?.segundos ?? plan.workSeconds}s
                      </span>
                      {detalhe?.instrucao && (
                        <span className="line-clamp-3 font-body text-[11px] leading-snug text-on-surface-variant">
                          {detalhe.instrucao}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {blockIndex < plan.blocks.length - 1 && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-primary-container/30 bg-primary-container/5 p-2">
                <Gif gifId={detalhes[plan.pauseExercise]?.gifId} size={56} />
                <div className="flex flex-col">
                  <span className="font-mono-label text-label-sm uppercase tracking-wider text-primary">
                    Pausa ativa · {formatClock(plan.pauseSeconds)}
                  </span>
                  <span className="font-body text-body-sm text-on-surface-variant">
                    {plan.pauseExercise}: {detalhes[plan.pauseExercise]?.instrucao}
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
            {iniciando ? "Iniciando..." : ehMissao ? "Iniciar treino" : "Iniciar alongamento"}
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
