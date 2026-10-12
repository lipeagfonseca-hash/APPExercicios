"use client";

import { useState } from "react";

export default function PenaltyModal({ missedDays }: { missedDays: number }) {
  const [dismissed, setDismissed] = useState(false);

  if (missedDays <= 0 || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-md rounded-xl border border-error/80 bg-[rgba(20,8,12,0.95)] backdrop-blur-2xl p-6 shadow-[0_0_45px_rgba(239,68,68,0.35)]">
        <p className="mb-2 font-mono-label text-label-sm uppercase tracking-[0.3em] text-error">
          Aviso do Sistema
        </p>
        <h2 className="mb-3 font-display text-headline-sm text-error">
          Você entrou na Zona de Penalidade
        </h2>
        <p className="mb-4 font-body text-body-md text-on-error-container">
          {missedDays} {missedDays === 1 ? "dia perdido" : "dias perdidos"}{" "}
          sem cumprir a Missão Diária. Registre um treino agora para encerrar
          a penalidade — o XP ganho será reduzido até isso acontecer.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="w-full rounded-lg bg-error px-4 py-2.5 font-mono-label text-label-md uppercase tracking-widest text-on-error hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]"
        >
          Aceitar penalidade
        </button>
      </div>
    </div>
  );
}
