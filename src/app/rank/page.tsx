import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeExerciseRanks } from "@/lib/rank";
import { RankBadge, RankLadder } from "@/components/RankHexagon";
import ShareCardButton from "@/components/ShareCardButton";

export default async function RankPage() {
  const session = await auth();
  const userId = session!.user.id;

  const workouts = await prisma.workout.findMany({
    where: { userId },
    include: { exercises: { include: { sets: true } } },
  });

  const ranks = computeExerciseRanks(workouts);

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Rank por exercício
      </h1>
      <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
        O rank mede sua evolução no exercício: do seu primeiro registro (E) até
        o seu recorde atual (até SSS). Continue batendo recordes pra subir.
      </p>

      {ranks.length === 0 ? (
        <p className="font-body text-body-sm text-on-surface-variant">
          Registre treinos pra começar a ranquear seus exercícios.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranks.map((row) => (
            <div
              key={row.name}
              className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-headline-sm text-on-surface">{row.name}</h2>
                  <p className="font-mono-label text-label-sm text-on-surface-variant">
                    {row.type === "CARDIO"
                      ? `${row.bestReps} reps no melhor treino`
                      : row.bestWeight
                        ? `${row.bestWeight}kg x ${row.bestReps} reps`
                        : `${row.bestReps} reps (peso corporal)`}
                  </p>
                </div>
                <RankBadge rank={row.rank} size="lg" />
              </div>

              <RankLadder current={row.rank} />

              <div className="mt-3 flex justify-end">
                <ShareCardButton
                  data={{
                    title: row.name,
                    subtitle: `Rank ${row.rank}`,
                    stats: [
                      {
                        label: "Melhor marca",
                        value:
                          row.type === "CARDIO"
                            ? `${row.bestReps} reps`
                            : row.bestWeight
                              ? `${row.bestWeight}kg x ${row.bestReps}`
                              : `${row.bestReps} reps`,
                      },
                      {
                        label: "Evolução",
                        value: `${Math.round(row.growth * 100)}%`,
                      },
                    ],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
