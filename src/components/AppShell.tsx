import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isInPenaltyZone } from "@/lib/leveling";
import { getTodayQuestWorkout, secondsUntilMidnightUtc } from "@/lib/dailyQuest";
import { hpMax, mpMax, computeFadiga } from "@/lib/hud";
import { isAdminEmail } from "@/lib/admin";
import Sidebar from "@/components/Sidebar";
import HudHeader from "@/components/HudHeader";
import BottomNav from "@/components/BottomNav";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <main className="min-h-screen">{children}</main>;
  }

  const userId = session.user.id;

  const [profile, todayWorkout] = await Promise.all([
    prisma.playerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    getTodayQuestWorkout(userId),
  ]);

  const isPenalty = isInPenaltyZone(profile.lastActivityDate, new Date());
  const totalRepsToday =
    todayWorkout?.exercises.reduce(
      (sum, e) => sum + e.sets.reduce((s, set) => s + set.reps, 0),
      0,
    ) ?? 0;

  return (
    <>
      <Sidebar
        name={session.user.name ?? "Caçador"}
        level={profile.level}
        xp={profile.xp}
        isPenalty={isPenalty}
        isAdmin={isAdminEmail(session.user.email)}
      />
      <HudHeader
        hpMax={hpMax(profile.level)}
        mpMax={mpMax(profile.level)}
        fadiga={computeFadiga(totalRepsToday)}
        secondsLeft={secondsUntilMidnightUtc()}
      />
      <div className="lg:pl-72">
        <main className="relative pt-28 w-full px-gutter lg:px-gutter-desktop min-h-screen pb-24 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
