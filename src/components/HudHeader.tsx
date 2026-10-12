import Countdown from "@/components/Countdown";

type Props = {
  secondsLeft: number;
};

export default function HudHeader({ secondsLeft }: Props) {
  return (
    <>
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface-container-lowest/80 backdrop-blur-xl z-40 px-gutter lg:px-gutter-desktop shadow-[0_1px_8px_rgba(0,0,0,0.4)] flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-6 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high/60 shrink-0">
            <span className="font-mono-label text-label-sm text-on-surface-variant uppercase">
              O DIA VIRA EM:
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
            O Treino do Dia é a sua Missão. Conclua o cronômetro até o fim para
            ganhar XP.
          </span>
        </div>
      </div>
    </>
  );
}
