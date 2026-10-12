"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Countdown from "@/components/Countdown";
import SystemNotification, { SystemResult } from "@/components/SystemNotification";
import type { ObjectiveProgress, QuestKey } from "@/lib/dailyQuest";

type Props = {
  objectives: ObjectiveProgress[];
  secondsLeft: number;
};

export default function QuestCard({ objectives: initial, secondsLeft }: Props) {
  const router = useRouter();
  const [objectives, setObjectives] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [levelUpResult, setLevelUpResult] = useState<SystemResult | null>(null);

  const completedCount = objectives.filter((o) => o.complete).length;
  const allComplete = completedCount === objectives.length;

  async function increment(key: QuestKey, amount: number) {
    setPending(`${key}-${amount}`);
    const res = await fetch("/api/daily-quest/increment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, amount }),
    });
    setPending(null);

    if (!res.ok) return;

    const data = await res.json();
    setObjectives(data.progress);

    if (data.system?.leveledUp) {
      setLevelUpResult(data.system);
    } else {
      router.refresh();
    }
  }

  function closeNotification() {
    setLevelUpResult(null);
    router.refresh();
  }

  return (
    <>
      {levelUpResult && (
        <SystemNotification result={levelUpResult} onClose={closeNotification} />
      )}
      <div className="relative rounded-xl bg-surface-container-lowest/85 backdrop-blur-2xl p-6 lg:p-8 shadow-[0_0_40px_rgba(0,210,255,0.18)] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,210,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-container to-transparent shadow-[0_0_12px_#00d2ff]" />

        <div className="flex flex-col gap-3 relative z-10 pb-6 border-b border-primary-container/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[24px]">
                crisis_alert
              </span>
              <span className="font-mono-label text-label-sm tracking-widest text-primary uppercase">
                REGISTRO DO SISTEMA [SYS.LV-QUEST]
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!allComplete && (
                <span className="px-2.5 py-1 rounded bg-error-container/40 text-error font-mono-label text-label-sm tracking-wider uppercase flex items-center gap-1.5 animate-penalty-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                  [OBRIGATÓRIA]
                </span>
              )}
              <span className="px-3 py-1 rounded bg-primary-container/20 text-primary-fixed-dim font-mono-label text-label-md tracking-wider">
                RANK: NENHUM
              </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
            <div>
              <h1 className="font-display text-headline-lg text-on-surface tracking-tight uppercase drop-shadow-[0_0_15px_rgba(0,210,255,0.4)]">
                Missão Diária: Preparação para Ficar Mais Forte
              </h1>
              <p className="font-body text-body-md text-on-surface-variant mt-1">
                O corpo do jogador deve suportar a ascensão de poder. A falha
                não é uma alternativa aceitável.
              </p>
            </div>
            {!allComplete && (
              <div className="flex flex-col items-start md:items-end bg-surface-container-low/90 px-4 py-2.5 rounded-lg shadow-inner">
                <span className="font-mono-label text-label-sm text-on-surface-variant uppercase tracking-wider">
                  TEMPO RESTANTE
                </span>
                <div className="flex items-baseline gap-1">
                  <Countdown
                    initialSeconds={secondsLeft}
                    className="font-mono-label text-stat-counter text-error tracking-widest animate-penalty-pulse"
                  />
                  <span className="font-mono-label text-label-sm text-error/80 uppercase">
                    RESTANTES
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {!allComplete && (
          <div className="my-6 rounded-lg bg-error-container/25 p-4 relative z-10 flex items-start gap-3.5 shadow-[0_0_20px_rgba(255,180,171,0.08)]">
            <span className="material-symbols-outlined text-error text-[24px] shrink-0 mt-0.5">
              report_problem
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono-label text-label-md text-error tracking-wider uppercase font-bold">
                AVISO DE PENALIDADE IMINENTE
              </span>
              <p className="font-body text-body-md text-on-surface leading-snug">
                Caso a <strong className="text-error font-semibold">Missão Diária</strong> não
                seja concluída dentro do tempo limite, o jogador será
                compulsoriamente transportado para a{" "}
                <strong className="text-error font-semibold">
                  Zona de Penalidade
                </strong>{" "}
                por 4 horas contínuas.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-3 pb-2 border-b border-primary-container/10">
            <span className="font-mono-label text-label-md text-primary uppercase tracking-widest whitespace-nowrap">
              [OBJETIVOS DE CONDICIONAMENTO]
            </span>
            <span
              className={`font-mono-label text-label-sm px-2.5 py-0.5 rounded ${
                allComplete
                  ? "bg-primary-container text-on-primary-container font-bold"
                  : "text-primary-fixed-dim bg-primary-container/15"
              }`}
            >
              {allComplete
                ? "MISSÕES DIÁRIAS CONCLUÍDAS"
                : `${completedCount} DE ${objectives.length} EM ANDAMENTO`}
            </span>
          </div>

          {objectives.map((objective, index) => (
            <ObjectiveRow
              key={objective.key}
              objective={objective}
              index={index}
              pending={pending}
              onIncrement={increment}
            />
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-primary-container/10 flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-mono-label text-label-sm">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">
              info
            </span>
            Progresso salvo instantaneamente no núcleo do Jogador.
          </span>
          <span className="text-primary uppercase tracking-widest">
            [SISTEMA: ATUALIZAÇÃO CONTÍNUA]
          </span>
        </div>
      </div>
    </>
  );
}

function ObjectiveRow({
  objective,
  index,
  pending,
  onIncrement,
}: {
  objective: ObjectiveProgress;
  index: number;
  pending: string | null;
  onIncrement: (key: QuestKey, amount: number) => void;
}) {
  const smallAmount = objective.unit === "km" ? 0.5 : 5;
  const bigAmount = objective.unit === "km" ? 1 : 10;

  return (
    <div className="p-4 rounded-xl bg-surface-container/70 hover:bg-surface-container/90 transition-all flex flex-col gap-3 group">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {objective.complete ? (
            <div className="w-6 h-6 rounded bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_12px_#00d2ff]">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded bg-surface-container-highest flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-display text-headline-sm text-on-surface tracking-wide uppercase">
              {index + 1}. {objective.label}
            </span>
            <span className="font-mono-label text-label-sm text-on-surface-variant">
              {objective.description}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-label text-headline-sm text-on-surface tracking-wider">
            [ {objective.current} / {objective.target} {objective.unit === "km" ? "KM" : ""} ]
          </span>
          <span
            className={`px-2.5 py-1 rounded font-mono-label text-label-sm tracking-wider uppercase ${
              objective.complete
                ? "bg-primary-container/20 text-primary-fixed shadow-[0_0_12px_rgba(0,210,255,0.4)]"
                : "bg-secondary-container/30 text-secondary"
            }`}
          >
            {objective.complete ? "COMPLETO" : "EM PROGRESSO"}
          </span>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-secondary-container to-primary-container rounded-full shadow-[0_0_10px_#00d2ff] transition-all duration-300"
          style={{ width: `${objective.pct}%` }}
        />
      </div>

      {!objective.complete && (
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono-label text-label-sm text-on-surface-variant uppercase">
            REGISTRAR ESFORÇO:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending === `${objective.key}-${smallAmount}`}
              onClick={() => onIncrement(objective.key, smallAmount)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-primary font-mono-label text-label-sm uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              +{smallAmount} {objective.unit === "km" ? "KM" : "REPS"}
            </button>
            <button
              type="button"
              disabled={pending === `${objective.key}-${bigAmount}`}
              onClick={() => onIncrement(objective.key, bigAmount)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-primary font-mono-label text-label-sm uppercase tracking-wider transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              +{bigAmount} {objective.unit === "km" ? "KM" : "REPS"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
