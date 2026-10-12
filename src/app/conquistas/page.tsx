import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeExerciseRanks, EXERCISE_RANKS } from "@/lib/rank";
import { accountAgeInDays, evaluateAchievements } from "@/lib/achievements";

export default async function AchievementsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, profile, workouts] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.playerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    prisma.workout.findMany({
      where: { userId },
      include: { exercises: { include: { sets: true } } },
    }),
  ]);

  const totalWorkouts = workouts.length;
  let totalVolume = 0;
  let hasStrength = false;
  let hasCardio = false;

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.type === "CARDIO") hasCardio = true;
      else hasStrength = true;
      for (const set of exercise.sets) {
        totalVolume += set.reps * (set.weightKg ?? 0);
      }
    }
  }

  const ranks = computeExerciseRanks(workouts);
  const bestRank = ranks.reduce<(typeof EXERCISE_RANKS)[number] | null>(
    (best, row) => {
      if (!best) return row.rank;
      return EXERCISE_RANKS.indexOf(row.rank) > EXERCISE_RANKS.indexOf(best)
        ? row.rank
        : best;
    },
    null,
  );

  const accountAgeDays = accountAgeInDays(user.createdAt);

  const achievements = evaluateAchievements({
    totalWorkouts,
    totalVolume,
    bestStreakDays: profile.bestStreakDays,
    level: profile.level,
    hasStrength,
    hasCardio,
    bestRank,
    accountAgeDays,
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Conquistas
      </h1>
      <p className="font-body text-body-md text-on-surface-variant">
        Você desbloqueou {unlockedCount}/{achievements.length} conquistas.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`flex flex-col items-center gap-1 rounded-xl backdrop-blur-xl p-4 text-center ${
              a.unlocked
                ? "bg-primary-container/10 shadow-[0_0_20px_rgba(0,210,255,0.1)]"
                : "bg-surface-container-lowest/60"
            }`}
          >
            <span className="text-3xl">{a.unlocked ? a.icon : "❔"}</span>
            <p
              className={`font-mono-label text-label-md uppercase ${
                a.unlocked ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {a.unlocked ? a.name : "???"}
            </p>
            <p className="font-body text-body-sm text-on-surface-variant">
              {a.unlocked ? a.description : "Conquista oculta"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
