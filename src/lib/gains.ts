import { prisma } from "@/lib/prisma";
import {
  applyXp,
  computeWorkoutGains,
  rankFromLevel,
  resolveDailyActivity,
  xpForLevel,
} from "@/lib/leveling";

type SetInput = { reps: number; weightKg?: number | null };
type ExerciseInput = { type: "STRENGTH" | "CARDIO"; sets: SetInput[] };

export type SystemResult = {
  xpGained: number;
  leveledUp: boolean;
  levelsGained: number;
  penaltyCleared: boolean;
  streakDays: number;
  level: number;
  xp: number;
  xpForNext: number;
  rank: ReturnType<typeof rankFromLevel>;
  statGains: { str: number; vit: number; agi: number; end: number };
};

export async function applyGainsForExercises(
  userId: string,
  exercises: ExerciseInput[],
  logMessage?: (result: SystemResult) => { tag: string; message: string },
): Promise<SystemResult> {
  const profile =
    (await prisma.playerProfile.findUnique({ where: { userId } })) ??
    (await prisma.playerProfile.create({ data: { userId } }));

  const now = new Date();
  const activity = resolveDailyActivity(
    profile.streakDays,
    profile.lastActivityDate,
    now,
  );

  const gains = computeWorkoutGains(exercises);
  const xpGained = Math.round(gains.xp * activity.xpMultiplier);
  const { level, xp, levelsGained } = applyXp(profile.level, profile.xp, xpGained);

  const updatedProfile = await prisma.playerProfile.update({
    where: { userId },
    data: {
      bestStreakDays: Math.max(profile.bestStreakDays, activity.streakDays),
      level,
      xp,
      str: profile.str + gains.strGain,
      vit: profile.vit + gains.vitGain,
      agi: profile.agi + gains.agiGain,
      end: profile.end + gains.endGain,
      streakDays: activity.streakDays,
      lastActivityDate: now,
    },
  });

  const result: SystemResult = {
    xpGained,
    leveledUp: levelsGained > 0,
    levelsGained,
    penaltyCleared: activity.penaltyCleared,
    streakDays: updatedProfile.streakDays,
    level: updatedProfile.level,
    xp: updatedProfile.xp,
    xpForNext: xpForLevel(updatedProfile.level),
    rank: rankFromLevel(updatedProfile.level),
    statGains: {
      str: gains.strGain,
      vit: gains.vitGain,
      agi: gains.agiGain,
      end: gains.endGain,
    },
  };

  const log = logMessage?.(result);
  if (log) {
    await prisma.systemLog.create({
      data: { profileId: updatedProfile.id, tag: log.tag, message: log.message },
    });
  }

  if (result.leveledUp) {
    await prisma.systemLog.create({
      data: {
        profileId: updatedProfile.id,
        tag: "SISTEMA: EVOLUÇÃO",
        message: `Você subiu para o nível ${result.level}! Rank atual: ${result.rank}.`,
      },
    });
  }

  if (result.penaltyCleared) {
    await prisma.systemLog.create({
      data: {
        profileId: updatedProfile.id,
        tag: "SISTEMA: PENALIDADE",
        message: "Zona de Penalidade encerrada. XP reduzido nesta sessão.",
      },
    });
  }

  return result;
}
