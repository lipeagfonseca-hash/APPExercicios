import { EXERCISE_RANKS, ExerciseRank } from "@/lib/rank";

export type AchievementStats = {
  totalWorkouts: number;
  totalVolume: number;
  bestStreakDays: number;
  level: number;
  hasStrength: boolean;
  hasCardio: boolean;
  bestRank: ExerciseRank | null;
  accountAgeDays: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

function rankAtLeast(rank: ExerciseRank | null, min: ExerciseRank): boolean {
  if (!rank) return false;
  return EXERCISE_RANKS.indexOf(rank) >= EXERCISE_RANKS.indexOf(min);
}

type Def = {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (s: AchievementStats) => boolean;
};

const DEFS: Def[] = [
  { id: "first-workout", name: "Primeiro Passo", description: "Registre seu primeiro treino", icon: "🏁", check: (s) => s.totalWorkouts >= 1 },
  { id: "10-workouts", name: "Caçador Regular", description: "10 treinos registrados", icon: "📘", check: (s) => s.totalWorkouts >= 10 },
  { id: "50-workouts", name: "Veterano", description: "50 treinos registrados", icon: "📗", check: (s) => s.totalWorkouts >= 50 },
  { id: "100-workouts", name: "Lenda Viva", description: "100 treinos registrados", icon: "📕", check: (s) => s.totalWorkouts >= 100 },
  { id: "volume-1k", name: "Peso Pena", description: "1.000kg de volume total levantado", icon: "🏋️", check: (s) => s.totalVolume >= 1000 },
  { id: "volume-10k", name: "Peso Pesado", description: "10.000kg de volume total levantado", icon: "🏋️‍♂️", check: (s) => s.totalVolume >= 10000 },
  { id: "volume-50k", name: "Monarca da Força", description: "50.000kg de volume total levantado", icon: "👑", check: (s) => s.totalVolume >= 50000 },
  { id: "streak-7", name: "Uma Semana de Fogo", description: "7 dias seguidos de treino", icon: "🔥", check: (s) => s.bestStreakDays >= 7 },
  { id: "streak-30", name: "Inquebrável", description: "30 dias seguidos de treino", icon: "⚡", check: (s) => s.bestStreakDays >= 30 },
  { id: "level-10", name: "Rank D", description: "Alcance o nível 10", icon: "🥉", check: (s) => s.level >= 10 },
  { id: "level-25", name: "Rank C", description: "Alcance o nível 25", icon: "🥈", check: (s) => s.level >= 25 },
  { id: "level-50", name: "Rank S", description: "Alcance o nível 50", icon: "🥇", check: (s) => s.level >= 50 },
  { id: "rank-d", name: "Primeira Evolução", description: "Alcance rank D ou melhor em um exercício", icon: "⬆️", check: (s) => rankAtLeast(s.bestRank, "D") },
  { id: "rank-s", name: "Elite", description: "Alcance rank S ou melhor em um exercício", icon: "💎", check: (s) => rankAtLeast(s.bestRank, "S") },
  { id: "rank-sss", name: "Além dos Limites", description: "Alcance rank SSS em um exercício", icon: "🌌", check: (s) => s.bestRank === "SSS" },
  { id: "multi-class", name: "Multiclasse", description: "Registre exercícios de força e cardio", icon: "⚔️", check: (s) => s.hasStrength && s.hasCardio },
  { id: "veteran-week", name: "Caçador Dedicado", description: "7 dias desde que virou caçador", icon: "🗓️", check: (s) => s.accountAgeDays >= 7 },
];

export function evaluateAchievements(stats: AchievementStats): Achievement[] {
  return DEFS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    unlocked: def.check(stats),
  }));
}

export function accountAgeInDays(createdAt: Date, now: Date = new Date()) {
  return Math.floor((now.getTime() - createdAt.getTime()) / 86_400_000);
}
