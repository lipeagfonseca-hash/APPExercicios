// ============================================================================
// CALENDÁRIO
// ----------------------------------------------------------------------------
// Mostra os treinos JÁ concluídos (registro real) e a PROJEÇÃO da rotação a
// partir do ponteiro atual, assumindo que nada falhe daqui para frente.
// ============================================================================

import Link from "next/link";
import { sessaoDoServidor } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { carregarVisaoDoDia } from "@/lib/rotacaoServico";
import { projetarProximosDias } from "@/lib/rotacao";
import { ID_DO_DESCANSO, SEQUENCIA_DA_ROTACAO } from "@/config/rotacao";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const COR_DO_ITEM: Record<string, string> = {
  A: "bg-primary-container/20 text-primary border-primary-container/40",
  B: "bg-secondary-container/20 text-secondary border-secondary-container/40",
  C: "bg-tertiary-container/20 text-tertiary border-tertiary-container/40",
  D: "bg-error-container/20 text-error border-error/40",
  [ID_DO_DESCANSO]: "bg-surface-container-high border-outline-variant/20 text-on-surface-variant",
};
const COR_PADRAO = "bg-surface-container-high border-outline-variant/20 text-on-surface-variant";

function parseMonthParam(value: string | undefined): { year: number; month: number } | null {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  return null;
}

function monthParam(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await sessaoDoServidor();
  const userId = session!.user.id;
  const visao = await carregarVisaoDoDia(userId);
  const hoje = visao.hoje;

  const { month: monthQuery } = await searchParams;
  const [anoDeHoje, mesDeHoje] = hoje.split("-").map(Number);
  const { year, month } = parseMonthParam(monthQuery) ?? { year: anoDeHoje, month: mesDeHoje - 1 };

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const prefixo = monthParam(year, month);

  // Treinos concluídos no mês (dias de Brasília, "AAAA-MM-DD").
  const concluidos = await prisma.treinoConcluido.findMany({
    where: { userId, dia: { startsWith: prefixo } },
    select: { dia: true, treinoId: true },
  });
  const treinoConcluidoPorDia = new Map(concluidos.map((c) => [c.dia, c.treinoId]));

  // Projeção para os próximos dias (cobre qualquer mês navegável à frente).
  const projecao = new Map(
    projetarProximosDias(SEQUENCIA_DA_ROTACAO, visao.ponteiro, hoje, 400).map((p) => [p.dia, p.item]),
  );

  const prevMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const nextMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };

  const cells: ({ day: number; iso: string } | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return { day, iso: `${prefixo}-${String(day).padStart(2, "0")}` };
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

      <p className="font-body text-body-sm text-on-surface-variant">
        ✅ treino concluído · cores = previsão da rotação (se nenhum dia falhar).
      </p>

      <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center font-mono-label text-label-sm text-on-surface-variant">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />;

            const feito = treinoConcluidoPorDia.get(cell.iso);
            const previsto = cell.iso >= hoje ? projecao.get(cell.iso) : undefined;
            const item = feito ?? previsto;
            const ehHoje = cell.iso === hoje;

            return (
              <div
                key={cell.iso}
                className={`relative flex flex-col items-center justify-center gap-0.5 rounded-lg border p-2 min-h-[64px] lg:min-h-[96px] ${
                  item ? (COR_DO_ITEM[item] ?? COR_PADRAO) : "border-transparent text-on-surface-variant/50"
                } ${ehHoje ? "ring-2 ring-primary-container" : ""}`}
              >
                <span className="font-mono-label text-label-sm">{cell.day}</span>
                {item && (
                  <span className="font-mono-label text-label-sm uppercase">
                    {item === ID_DO_DESCANSO ? "Desc." : item}
                  </span>
                )}
                {feito && <span className="absolute top-1 right-1 text-[10px]">✅</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
