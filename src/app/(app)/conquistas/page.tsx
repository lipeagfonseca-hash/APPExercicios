import { sessaoObrigatoria } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { carregarEstatisticas } from "@/lib/estatisticas";
import { EXERCISE_RANKS, type ExerciseRank } from "@/lib/rank";
import { accountAgeInDays, evaluateAchievements } from "@/lib/achievements";

export default async function AchievementsPage() {
  const session = await sessaoObrigatoria();
  const userId = session.user.id;

  const [user, estatisticas] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    carregarEstatisticas(userId),
  ]);

  // Maior rank entre todos os exercícios.
  const melhorRank = estatisticas.ranks.reduce<ExerciseRank | null>(
    (melhor, linha) =>
      melhor === null || EXERCISE_RANKS.indexOf(linha.rank) > EXERCISE_RANKS.indexOf(melhor) ? linha.rank : melhor,
    null,
  );

  const achievements = evaluateAchievements({
    treinosConcluidos: estatisticas.treinosConcluidos,
    minutosDeEsforco: estatisticas.minutosDeEsforco,
    melhorSequencia: estatisticas.perfil.bestStreakDays,
    nivel: estatisticas.perfil.level,
    melhorRank,
    accountAgeDays: accountAgeInDays(user.createdAt),
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
