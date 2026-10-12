import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyXp, rankFromLevel, xpForLevel } from "@/lib/leveling";
import {
  computeObjectiveProgress,
  getOrCreateTodayQuestWorkout,
  todayUtcMidnight,
} from "@/lib/dailyQuest";

const BONUS_XP = 50;
const BONUS_STAT = 1;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = session.user.id;

  const workout = await getOrCreateTodayQuestWorkout(userId);
  const progress = computeObjectiveProgress(workout);
  const allComplete = progress.every((o) => o.complete);

  if (!allComplete) {
    return NextResponse.json(
      { error: "Complete os 4 objetivos primeiro." },
      { status: 400 },
    );
  }

  const profile =
    (await prisma.playerProfile.findUnique({ where: { userId } })) ??
    (await prisma.playerProfile.create({ data: { userId } }));

  const today = todayUtcMidnight();
  const alreadyClaimed =
    profile.lastRewardClaimDate &&
    todayUtcMidnight(profile.lastRewardClaimDate).getTime() === today.getTime();

  if (alreadyClaimed) {
    return NextResponse.json(
      { error: "Recompensa de hoje já resgatada." },
      { status: 400 },
    );
  }

  const { level, xp, levelsGained } = applyXp(profile.level, profile.xp, BONUS_XP);

  const updated = await prisma.playerProfile.update({
    where: { userId },
    data: {
      level,
      xp,
      str: profile.str + BONUS_STAT,
      vit: profile.vit + BONUS_STAT,
      agi: profile.agi + BONUS_STAT,
      end: profile.end + BONUS_STAT,
      lastRewardClaimDate: today,
    },
  });

  await prisma.systemLog.create({
    data: {
      profileId: updated.id,
      tag: "SISTEMA: RECOMPENSA",
      message: `Recompensa diária resgatada! +${BONUS_XP} XP, +${BONUS_STAT} em todos os atributos.`,
    },
  });

  return NextResponse.json({
    level: updated.level,
    xp: updated.xp,
    xpForNext: xpForLevel(updated.level),
    rank: rankFromLevel(updated.level),
    leveledUp: levelsGained > 0,
  });
}
