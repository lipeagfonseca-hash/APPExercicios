import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeObjectiveProgress,
  getOrCreateTodayQuestWorkout,
  secondsUntilMidnightUtc,
  todayUtcMidnight,
} from "@/lib/dailyQuest";
import { isInPenaltyZone, missedDays as computeMissedDays } from "@/lib/leveling";
import QuestCard from "@/components/QuestCard";
import RewardsPanel from "@/components/RewardsPanel";
import SystemLogPanel from "@/components/SystemLogPanel";
import PenaltyModal from "@/components/PenaltyModal";
import Timer from "@/components/Timer";
import WorkoutForm from "@/components/WorkoutForm";
import WorkoutList from "@/components/WorkoutList";
import TodayProgram from "@/components/TodayProgram";
import TimedProgram from "@/components/TimedProgram";
import { getScheduleForDate } from "@/lib/trainingCycle";
import { CIRCUIT_REST, PROGRAM_EXERCISE_MEDIA } from "@/lib/programMedia";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile, questWorkout, logs, workouts] = await Promise.all([
    prisma.playerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    getOrCreateTodayQuestWorkout(userId),
    prisma.systemLog.findMany({
      where: { profile: { userId } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.workout.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { sets: { orderBy: { order: "asc" } } },
        },
      },
    }),
  ]);

  const schedule = getScheduleForDate(new Date());
  const objectives = computeObjectiveProgress(questWorkout);
  const allComplete = objectives.every((o) => o.complete);
  const now = new Date();
  const isPenalty = isInPenaltyZone(profile.lastActivityDate, now);
  const missed = computeMissedDays(profile.lastActivityDate, now);
  const alreadyClaimed =
    profile.lastRewardClaimDate &&
    todayUtcMidnight(profile.lastRewardClaimDate).getTime() ===
      todayUtcMidnight(now).getTime();

  const toneIndex = Math.min(
    99,
    Math.round((profile.str + profile.vit + profile.agi + profile.end) / 8),
  );

  return (
    <div className="flex flex-col w-full">
      <PenaltyModal missedDays={missed} />

      <div className="relative w-full">
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-tertiary-container/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-container shadow-[0_0_10px_#00d2ff]" />
            <span className="font-mono-label text-label-md text-primary tracking-widest uppercase">
              [OVERLAY DIRECTIVE // SISTEMA ATIVO]
            </span>
          </div>
          <span className="font-mono-label text-label-sm text-on-surface-variant uppercase">
            SINC. NEURAL: {isPenalty ? "INSTÁVEL" : "ESTÁVEL"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-gutter-desktop items-start">
          <section className="lg:col-span-8 flex flex-col gap-6">
            {schedule.type === "TRAIN" && schedule.program.timed ? (
              <TimedProgram program={schedule.program} />
            ) : schedule.type === "TRAIN" ? (
              <TodayProgram
                program={schedule.program}
                exercises={schedule.program.exercises.map((ex) => ({
                  name: ex.name,
                  type: ex.type,
                  rounds: ex.sets.length,
                  reps: ex.sets[0]?.reps ?? 0,
                  mediaId: PROGRAM_EXERCISE_MEDIA[ex.name] ?? null,
                }))}
                exerciseRest={CIRCUIT_REST.exerciseSeconds}
                roundRest={CIRCUIT_REST.roundSeconds}
              />
            ) : (
              <section className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-5">
                <span className="font-mono-label text-label-md uppercase tracking-wider text-primary">
                  [PROGRAMA DO DIA]
                </span>
                <h2 className="font-display text-headline-md text-on-surface">
                  Dia de descanso
                </h2>
                <p className="mt-1 font-body text-body-sm text-on-surface-variant">
                  Sem circuito hoje. Recupere, hidrate-se e cumpra a Missão Diária.
                </p>
              </section>
            )}

            <QuestCard
              objectives={objectives}
              secondsLeft={secondsUntilMidnightUtc()}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-label text-label-md text-primary uppercase tracking-wider">
                    [RESISTÊNCIA FÍSICA]
                  </span>
                  <span className="material-symbols-outlined text-primary-container text-[20px]">
                    fitness_center
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display text-headline-md text-on-surface">
                      {toneIndex}%
                    </span>
                    <span className="block font-mono-label text-label-sm text-on-surface-variant">
                      ÍNDICE DE TÔNUS MUSCULAR
                    </span>
                  </div>
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container-highest"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-primary-container"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${toneIndex}, 100`}
                        strokeWidth="3.5"
                      />
                    </svg>
                    <span className="absolute font-mono-label text-label-sm text-primary font-bold">
                      {toneIndex}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between font-mono-label text-label-sm text-on-surface-variant">
                  <span>STR: {profile.str}</span>
                  <span className="text-primary">META: +1.0 STR/DIA</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-error-container/20 backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-label text-label-md text-error uppercase tracking-wider">
                    [PUNIÇÃO DE SOBREVIVÊNCIA]
                  </span>
                  <span className="material-symbols-outlined text-error text-[20px]">
                    timer
                  </span>
                </div>
                <div>
                  <span className="font-display text-headline-md text-error tracking-tight">
                    DESERTO DOS CENTÍPEDES
                  </span>
                  <span className="block font-mono-label text-label-sm text-on-error-container mt-1">
                    Ambiente de calor extremo com bestas mágicas classe-D sem
                    pausa.
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-error/20 flex justify-between font-mono-label text-label-sm text-error">
                  <span>STATUS: {isPenalty ? "ATIVA" : "SUSPENSO"}</span>
                  <span className="font-bold">
                    {isPenalty ? `${missed} DIA(S) PENDENTE(S)` : "CONDICIONADO AO PRAZO"}
                  </span>
                </div>
              </div>
            </div>

            <Timer />
            <WorkoutForm />

            <div>
              <h2 className="mb-3 font-mono-label text-label-md uppercase tracking-wider text-primary">
                Treinos recentes
              </h2>
              <WorkoutList
                workouts={workouts.map((w) => ({
                  ...w,
                  date: w.date.toISOString(),
                }))}
              />
            </div>
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-6">
            <RewardsPanel
              unlocked={allComplete}
              alreadyClaimed={!!alreadyClaimed}
            />
            <SystemLogPanel logs={logs} />
            <div className="p-4 rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
                auto_awesome
              </span>
              <div className="flex flex-col">
                <span className="font-mono-label text-label-sm text-tertiary uppercase font-bold tracking-wider">
                  AURA DE MONARCA
                </span>
                <span className="font-body text-body-sm text-on-surface leading-tight mt-0.5">
                  A disciplina continuada converte esforço físico bruto em
                  mana latente para o Despertar.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
