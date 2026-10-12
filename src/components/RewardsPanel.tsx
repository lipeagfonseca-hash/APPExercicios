"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  unlocked: boolean;
  alreadyClaimed: boolean;
};

const REWARDS = [
  {
    icon: "health_and_safety",
    iconWrapClass: "bg-primary-container/20 text-primary-container",
    labelClass: "text-primary",
    title: "Recuperação Completa do Estado Físico & Fadiga",
    description: "Restaura 100% de HP/MP e zera exaustão",
  },
  {
    icon: "upgrade",
    iconWrapClass: "bg-tertiary-container/20 text-tertiary",
    labelClass: "text-tertiary",
    title: "+1 Ponto em Todos os Atributos",
    description: "STR, AGI, VIT e END aumentam igualmente",
  },
  {
    icon: "lock_open",
    iconWrapClass: "bg-secondary-container/20 text-secondary",
    labelClass: "text-secondary",
    title: "+50 XP Bônus",
    description: "Recompensa por cumprir a Missão Diária completa",
  },
];

export default function RewardsPanel({ unlocked, alreadyClaimed }: Props) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(alreadyClaimed);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    const res = await fetch("/api/daily-quest/claim", { method: "POST" });
    setClaiming(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao resgatar.");
      return;
    }

    setClaimed(true);
    router.refresh();
  }

  const canClaim = unlocked && !claimed;

  return (
    <div className="rounded-xl bg-surface-container-lowest/85 backdrop-blur-2xl p-6 shadow-[0_0_30px_rgba(0,119,254,0.15)] flex flex-col gap-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between pb-3 border-b border-primary-container/20">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[22px]">
            featured_seasonal_and_gifts
          </span>
          <h2 className="font-display text-headline-sm uppercase text-on-surface tracking-wider">
            Recompensas
          </h2>
        </div>
        <span className="font-mono-label text-label-sm text-primary px-2 py-0.5 rounded bg-primary-container/10">
          [{REWARDS.length} DISPONÍVEIS]
        </span>
      </div>

      <div className="flex flex-col gap-3.5">
        {REWARDS.map((reward, i) => (
          <div
            key={i}
            className="p-3.5 rounded-lg bg-surface-container/60 hover:bg-surface-container/90 transition-all flex items-start gap-3"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${reward.iconWrapClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {reward.icon}
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className={`font-mono-label text-label-sm uppercase font-bold tracking-wider ${reward.labelClass}`}
              >
                RECOMPENSA {i + 1}
              </span>
              <span className="font-body text-body-md text-on-surface font-medium leading-snug">
                {reward.title}
              </span>
              <span className="font-mono-label text-label-sm text-on-surface-variant mt-0.5">
                {reward.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          type="button"
          className={`w-full py-3.5 px-4 rounded-lg font-mono-label text-label-md uppercase tracking-widest font-bold flex items-center justify-center gap-2 transition-all ${
            canClaim
              ? "bg-primary-container text-on-primary-container hover:shadow-[0_0_25px_rgba(0,210,255,0.6)] cursor-pointer"
              : "bg-surface-container-high text-on-surface-variant cursor-not-allowed"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {claimed ? "check_circle" : canClaim ? "lock_open" : "lock"}
          </span>
          <span>
            {claiming
              ? "RESGATANDO..."
              : claimed
                ? "RESGATADO HOJE"
                : "RESGATAR RECOMPENSAS"}
          </span>
        </button>
        <span className="font-mono-label text-label-sm text-center text-on-surface-variant">
          {error ??
            (claimed
              ? "Volte amanhã para uma nova recompensa."
              : canClaim
                ? "Todos os requisitos cumpridos! Reclame agora."
                : "Complete todos os 4 objetivos para desbloquear")}
        </span>
      </div>
    </div>
  );
}
