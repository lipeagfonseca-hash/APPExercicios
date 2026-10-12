import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HistoryChart from "@/components/HistoryChart";

export default async function HistoryPage() {
  const session = await auth();

  const workouts = await prisma.workout.findMany({
    where: { userId: session!.user.id },
    orderBy: { date: "asc" },
    include: { exercises: { include: { sets: true } } },
  });

  const data = workouts.map((workout) => {
    const volume = workout.exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.reduce(
          (sum, set) => sum + set.reps * (set.weightKg ?? 0),
          0,
        ),
      0,
    );
    return {
      date: workout.date.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
      volume: Math.round(volume),
    };
  });

  const totalWorkouts = workouts.length;
  const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
  const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Histórico
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
          <p className="font-mono-label text-label-sm uppercase text-on-surface-variant">
            Treinos registrados
          </p>
          <p className="font-display text-headline-md text-on-surface">
            {totalWorkouts}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
          <p className="font-mono-label text-label-sm uppercase text-on-surface-variant">
            Volume total (kg)
          </p>
          <p className="font-display text-headline-md text-on-surface">
            {totalVolume}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
          <p className="font-mono-label text-label-sm uppercase text-on-surface-variant">
            Média por treino (kg)
          </p>
          <p className="font-display text-headline-md text-on-surface">
            {avgVolume}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-mono-label text-label-md uppercase tracking-wider text-primary">
          Volume por treino (reps x kg)
        </h2>
        <HistoryChart data={data} />
      </div>
    </div>
  );
}
