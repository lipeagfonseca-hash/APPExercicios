import Countdown from "@/components/Countdown";

type Props = {
  hpMax: number;
  mpMax: number;
  fadiga: number;
  secondsLeft: number;
};

export default function HudHeader({ hpMax, mpMax, fadiga, secondsLeft }: Props) {
  return (
    <>
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface-container-lowest/80 backdrop-blur-xl z-40 px-gutter lg:px-gutter-desktop shadow-[0_1px_8px_rgba(0,0,0,0.4)] flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-6 overflow-x-auto">
          <div className="flex items-center gap-3 bg-surface-container-low/80 px-3.5 py-2 rounded-lg shrink-0">
            <span className="font-mono-label text-label-sm font-bold text-error uppercase">
              HP
            </span>
            <div className="w-20 lg:w-28 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-error rounded-full" style={{ width: "100%" }} />
            </div>
            <span className="font-mono-label text-label-sm text-on-surface hidden sm:inline">
              {hpMax.toLocaleString("pt-BR")}/{hpMax.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center gap-3 bg-surface-container-low/80 px-3.5 py-2 rounded-lg shrink-0">
            <span className="font-mono-label text-label-sm font-bold text-primary-container uppercase">
              MP
            </span>
            <div className="w-16 lg:w-24 h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full"
                style={{ width: "100%" }}
              />
            </div>
            <span className="font-mono-label text-label-sm text-on-surface hidden sm:inline">
              {mpMax.toLocaleString("pt-BR")}/{mpMax.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="hidden xl:flex items-center gap-2 bg-surface-container-low/80 px-3.5 py-2 rounded-lg shrink-0">
            <span className="font-mono-label text-label-sm font-bold text-tertiary-fixed uppercase">
              FADIGA
            </span>
            <span className="font-mono-label text-label-sm text-on-surface">
              {fadiga}%
            </span>
          </div>
          <div className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high/60 shrink-0">
            <span className="font-mono-label text-label-sm text-on-surface-variant uppercase">
              TEMPO RESTANTE:
            </span>
            <Countdown
              initialSeconds={secondsLeft}
              className="font-mono-label text-label-sm text-error font-bold tracking-widest animate-penalty-pulse"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button
            className="w-10 h-10 rounded-lg hidden sm:flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">volume_up</span>
          </button>
          <div className="relative">
            <button
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,210,255,1)]" />
            </button>
          </div>
        </div>
      </header>
      <div className="fixed top-20 left-0 lg:left-72 right-0 h-8 bg-error-container/20 backdrop-blur-md z-30 px-gutter lg:px-gutter-desktop flex items-center overflow-hidden">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-error text-[16px]">
            crisis_alert
          </span>
          <span className="font-mono-label text-label-sm text-on-error-container uppercase font-bold tracking-wide">
            ATENÇÃO:
          </span>
          <span className="font-body text-body-sm text-on-surface-variant">
            A falta de cumprimento da Missão Diária resultará em Penalidade de
            Sobrevivência.
          </span>
        </div>
      </div>
    </>
  );
}
