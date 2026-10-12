import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScheduleForDate } from "@/lib/trainingCycle";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const PROGRAM_COLOR: Record<string, string> = {
  "low-a": "bg-primary-container/20 text-primary border-primary-container/40",
  "low-b": "bg-secondary-container/20 text-secondary border-secondary-container/40",
  "low-c": "bg-tertiary-container/20 text-tertiary border-tertiary-container/40",
  "low-d": "bg-error-container/20 text-error border-error/40",
  "hiit-q48-a": "bg-primary-container/20 text-primary border-primary-container/40",
  "hiit-q48-b": "bg-secondary-container/20 text-secondary border-secondary-container/40",
  "hiit-q48-c": "bg-tertiary-container/20 text-tertiary border-tertiary-container/40",
  "hiit-q48-d": "bg-error-container/20 text-error border-error/40",
};

function parseMonthParam(value: string | undefined): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { month: monthQuery } = await searchParams;
  const { year, month } = parseMonthParam(monthQuery);

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = monthStart.getUTCDay();

  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: monthStart, lt: monthEnd } },
    select: { date: true },
  });
  const loggedDays = new Set(
    workouts.map((w) => w.date.toISOString().slice(0, 10)),
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const cells: ({ day: number; iso: string } | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { day, iso };
    }),
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-headline-lg uppercase text-on-surface">
          Calendário de Treino
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendario?month=${monthParam(prevMonth.year, prevMonth.month)}`}
            className="rounded-lg border border-primary-container/30 px-3 py-1.5 font-mono-label text-label-sm text-primary hover:bg-primary-container/10"
          >
            ← Anterior
          </Link>
          <span className="font-display text-headline-sm text-on-surface px-2">
            {MONTH_NAMES[month]} {year}
          </span>
          <Link
            href={`/calendario?month=${monthParam(nextMonth.year, nextMonth.month)}`}
            className="rounded-lg border border-primary-container/30 px-3 py-1.5 font-mono-label text-label-sm text-primary hover:bg-primary-container/10"
          >
            Próximo →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 font-mono-label text-label-sm">
        <Legend colorClass="bg-primary-container/20 border-primary-container/40 text-primary" label="Dia A" />
        <Legend colorClass="bg-secondary-container/20 border-secondary-container/40 text-secondary" label="Dia B" />
        <Legend colorClass="bg-tertiary-container/20 border-tertiary-container/40 text-tertiary" label="Dia C" />
        <Legend colorClass="bg-error-container/20 border-error/40 text-error" label="Dia D" />
        <Legend colorClass="bg-surface-container-high border-outline-variant/30 text-on-surface-variant" label="Descanso" />
      </div>

      <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center font-mono-label text-label-sm text-on-surface-variant"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />;

            const schedule = getScheduleForDate(new Date(`${cell.iso}T00:00:00Z`));
            const done = loggedDays.has(cell.iso);
            const isToday = cell.iso === todayIso;
            const colorClass =
              schedule.type === "TRAIN"
                ? PROGRAM_COLOR[schedule.program.id]
                : "bg-surface-container-high border-outline-variant/20 text-on-surface-variant";

            return (
              <div
                key={cell.iso}
                className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg border p-2 min-h-[64px] lg:min-h-[96px] ${colorClass} ${
                  isToday ? "ring-2 ring-primary-container" : ""
                }`}
              >
                <span className="font-mono-label text-label-sm">{cell.day}</span>
                <span className="font-mono-label text-label-sm uppercase">
                  {schedule.type === "REST" ? "Desc." : schedule.program.id.slice(-1).toUpperCase()}
                </span>
                {done && (
                  <span className="absolute top-1 right-1 text-[10px]">✅</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className={`rounded border px-2 py-1 uppercase ${colorClass}`}>
      {label}
    </span>
  );
}
