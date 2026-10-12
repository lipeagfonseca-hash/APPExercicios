import { PROGRAMS, type Program } from "@/lib/programs";
import { formatClock, buildSegments, totalSeconds } from "@/lib/timedProgram";
import { getScheduleForDate } from "@/lib/trainingCycle";
import UseProgramButton from "@/components/UseProgramButton";

const TRACKS: { id: Program["track"]; title: string; subtitle: string }[] = [
  {
    id: "low-impact",
    title: "Baixo impacto · 10 min",
    subtitle: "Sem saltos, em pé, apoiado ou sentado. Pausas ativas de marcha estática. Ideal para retomar a rotina.",
  },
  {
    id: "classic",
    title: "HIIT clássico",
    subtitle: "Circuitos de alta intensidade com saltos. Use quando o condicionamento estiver mais avançado.",
  },
];

export default function ProgramsPage() {
  const today = getScheduleForDate(new Date());

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Programas de treino
      </h1>
      <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
        Circuitos intercalados: 2 dias de treino pra cada 1
        dia de descanso. Escolha um e ele preenche o formulário de novo treino
        automaticamente.
      </p>

      <div className="rounded-xl bg-primary-container/10 p-4 flex items-center justify-between gap-3 flex-wrap">
        <span className="font-mono-label text-label-sm uppercase tracking-wider text-primary">
          [CICLO DE HOJE]
        </span>
        {today.type === "REST" ? (
          <span className="font-display text-headline-sm text-on-surface">
            Descanso — sem treino hoje
          </span>
        ) : (
          <span className="font-display text-headline-sm text-on-surface">
            {today.program.className}: {today.program.name}
          </span>
        )}
      </div>

      {TRACKS.map((track) => (
        <section key={track.id} className="flex flex-col gap-3">
          <div>
            <h2 className="font-mono-label text-label-md uppercase tracking-wider text-primary">
              {track.title}
            </h2>
            <p className="font-body text-body-sm text-on-surface-variant">{track.subtitle}</p>
          </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PROGRAMS.filter((p) => p.track === track.id).map((program) => {
          const isToday = today.type === "TRAIN" && today.program.id === program.id;
          return (
            <div
              key={program.id}
              className={`flex flex-col gap-3 rounded-xl backdrop-blur-xl p-4 ${
                isToday
                  ? "bg-primary-container/10 shadow-[0_0_25px_rgba(0,210,255,0.2)]"
                  : "bg-surface-container-lowest/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-primary-container/10 px-2 py-0.5 font-mono-label text-label-sm uppercase text-primary">
                  {program.className}
                </span>
                {isToday && (
                  <span className="rounded bg-primary-container px-2 py-0.5 font-mono-label text-label-sm uppercase text-on-primary-container">
                    Hoje
                  </span>
                )}
              </div>
              <h2 className="font-display text-headline-sm text-on-surface">
                {program.name}
              </h2>
              <p className="font-body text-body-sm text-on-surface-variant">
                {program.description}
              </p>
              <ul className="font-mono-label text-label-sm text-on-surface-variant">
                {program.timed && (
                  <li className="text-primary">
                    • {formatClock(totalSeconds(buildSegments(program)))} · 3 blocos · 2 pausas ativas
                  </li>
                )}
                {program.exercises.map((ex) => (
                  <li key={ex.name}>
                    • {ex.name} (
                    {program.timed
                      ? `${ex.sets.length}x${program.timed.workSeconds}s`
                      : `${ex.sets.length}x${ex.sets[0]?.reps}`}
                    )
                  </li>
                ))}
              </ul>
              <UseProgramButton program={program} />
            </div>
          );
        })}
      </div>
        </section>
      ))}
    </div>
  );
}
