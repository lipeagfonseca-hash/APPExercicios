"use client";

export type SystemResult = {
  xpGained: number;
  leveledUp: boolean;
  levelsGained: number;
  penaltyCleared: boolean;
  streakDays: number;
  level: number;
  rank: string;
  statGains: { str: number; vit: number; agi: number; end: number };
};

export default function SystemNotification({
  result,
  onClose,
}: {
  result: SystemResult;
  onClose: () => void;
}) {
  const gains = Object.entries(result.statGains).filter(([, v]) => v > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-md rounded-xl border border-primary-container/60 bg-surface-container-lowest/95 backdrop-blur-2xl p-6 text-center shadow-[0_0_40px_-5px_rgba(0,210,255,0.6)]">
        <p className="mb-1 font-mono-label text-label-sm uppercase tracking-[0.3em] text-primary">
          Sistema
        </p>

        {result.penaltyCleared ? (
          <h2 className="mb-2 font-display text-headline-sm text-tertiary">
            Penalidade cumprida
          </h2>
        ) : (
          <h2 className="mb-2 font-display text-headline-sm text-on-surface">
            Missão Diária concluída
          </h2>
        )}

        <p className="mb-3 font-mono-label text-stat-counter text-primary">
          +{result.xpGained} XP
        </p>

        {result.leveledUp && (
          <p className="mb-3 font-display text-headline-md text-primary-container drop-shadow-[0_0_15px_rgba(0,210,255,0.5)]">
            LEVEL UP! → Nv. {result.level} (Rank {result.rank})
          </p>
        )}

        {gains.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2 font-mono-label text-label-sm text-on-surface">
            {gains.map(([stat, value]) => (
              <span
                key={stat}
                className="rounded bg-primary-container/10 px-2 py-1 uppercase"
              >
                {stat} +{value}
              </span>
            ))}
          </div>
        )}

        <p className="mb-4 font-mono-label text-label-sm text-on-surface-variant">
          🔥 Sequência: {result.streakDays}{" "}
          {result.streakDays === 1 ? "dia" : "dias"}
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-primary-container px-4 py-2.5 font-mono-label text-label-md uppercase tracking-widest text-on-primary-container hover:shadow-[0_0_25px_rgba(0,210,255,0.6)]"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
