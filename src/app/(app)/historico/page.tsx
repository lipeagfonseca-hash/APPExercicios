import { sessaoObrigatoria } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { TREINOS } from "@/config/treinos";
import { esforcoDeUmTreino } from "@/lib/esforco";
import HistoryChart from "@/components/HistoryChart";

const CARTAO = "rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4";

export default async function HistoryPage() {
  const session = await sessaoObrigatoria();

  const concluidos = await prisma.treinoConcluido.findMany({
    where: { userId: session.user.id },
    orderBy: { dia: "asc" },
    select: { dia: true, treinoId: true, xpConcedido: true },
  });

  // Minutos de esforço de cada treino concluído (pela configuração do treino).
  const data = concluidos.map((c) => {
    const programa = TREINOS[c.treinoId];
    return {
      date: c.dia.split("-").reverse().slice(0, 2).join("/"),
      minutos: programa ? Math.round((esforcoDeUmTreino(programa).totalSegundos / 60) * 10) / 10 : 0,
    };
  });

  const totalTreinos = concluidos.length;
  const totalMinutos = Math.round(data.reduce((soma, d) => soma + d.minutos, 0));
  const totalXp = concluidos.reduce((soma, c) => soma + c.xpConcedido, 0);

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">Histórico</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={CARTAO}>
          <p className="font-mono-label text-label-sm uppercase text-on-surface-variant">Treinos concluídos</p>
          <p className="font-display text-headline-md text-on-surface">{totalTreinos}</p>
        </div>
        <div className={CARTAO}>
          <p className="font-mono-label text-label-sm uppercase text-on-surface-variant">Minutos de esforço</p>
          <p className="font-display text-headline-md text-on-surface">{totalMinutos}</p>
        </div>
        <div className={CARTAO}>
          <p className="font-mono-label text-label-sm uppercase text-on-surface-variant">XP ganho em treinos</p>
          <p className="font-display text-headline-md text-on-surface">{totalXp}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-mono-label text-label-md uppercase tracking-wider text-primary">
          Minutos de esforço por treino
        </h2>
        <HistoryChart data={data} />
      </div>
    </div>
  );
}
