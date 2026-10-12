// ============================================================================
// CONQUISTAS (calculadas na hora, nada é guardado)
// ----------------------------------------------------------------------------
// Todas vêm de dados reais do histórico de treinos concluídos. Cada uma é um
// "título" desbloqueado por um critério verificável.
// ============================================================================

import { EXERCISE_RANKS, type ExerciseRank } from "./rank.ts";

export type AchievementStats = {
  /** Treinos da rotação concluídos. */
  treinosConcluidos: number;
  /** Minutos de esforço acumulados (exercícios + pausas ativas). */
  minutosDeEsforco: number;
  melhorSequencia: number;
  nivel: number;
  melhorRank: ExerciseRank | null;
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
  { id: "first-workout", name: "Primeiro Passo", description: "Conclua seu primeiro treino", icon: "🏁", check: (s) => s.treinosConcluidos >= 1 },
  { id: "10-workouts", name: "Caçador Regular", description: "10 treinos concluídos", icon: "📘", check: (s) => s.treinosConcluidos >= 10 },
  { id: "50-workouts", name: "Veterano", description: "50 treinos concluídos", icon: "📗", check: (s) => s.treinosConcluidos >= 50 },
  { id: "100-workouts", name: "Lenda Viva", description: "100 treinos concluídos", icon: "📕", check: (s) => s.treinosConcluidos >= 100 },
  { id: "year-workouts", name: "Um Ano de Disciplina", description: "244 treinos concluídos (um ano de rotina)", icon: "👑", check: (s) => s.treinosConcluidos >= 244 },
  { id: "minutes-60", name: "Primeira Hora", description: "60 minutos de esforço acumulados", icon: "⏱️", check: (s) => s.minutosDeEsforco >= 60 },
  { id: "minutes-300", name: "Cinco Horas de Suor", description: "300 minutos de esforço acumulados", icon: "💧", check: (s) => s.minutosDeEsforco >= 300 },
  { id: "minutes-1000", name: "Mil Minutos", description: "1.000 minutos de esforço acumulados", icon: "🔥", check: (s) => s.minutosDeEsforco >= 1000 },
  { id: "streak-5", name: "Cinco Seguidos", description: "5 treinos seguidos sem falhar (bônus de XP)", icon: "🔥", check: (s) => s.melhorSequencia >= 5 },
  { id: "streak-20", name: "Inquebrável", description: "20 treinos seguidos sem falhar", icon: "⚡", check: (s) => s.melhorSequencia >= 20 },
  { id: "streak-60", name: "Imparável", description: "60 treinos seguidos sem falhar", icon: "🌪️", check: (s) => s.melhorSequencia >= 60 },
  { id: "level-10", name: "Classe D", description: "Alcance o nível 10", icon: "🥉", check: (s) => s.nivel >= 10 },
  { id: "level-20", name: "Classe C", description: "Alcance o nível 20", icon: "🥈", check: (s) => s.nivel >= 20 },
  { id: "level-30", name: "Classe B", description: "Alcance o nível 30", icon: "🥇", check: (s) => s.nivel >= 30 },
  { id: "level-40", name: "Classe A", description: "Alcance o nível 40", icon: "🏅", check: (s) => s.nivel >= 40 },
  { id: "level-50", name: "Classe S", description: "Alcance o nível 50", icon: "💎", check: (s) => s.nivel >= 50 },
  { id: "rank-d", name: "Primeira Evolução", description: "Alcance rank D em um exercício", icon: "⬆️", check: (s) => rankAtLeast(s.melhorRank, "D") },
  { id: "rank-s", name: "Elite", description: "Alcance rank S em um exercício", icon: "🌟", check: (s) => rankAtLeast(s.melhorRank, "S") },
  { id: "rank-sss", name: "Além dos Limites", description: "Alcance rank SSS em um exercício", icon: "🌌", check: (s) => s.melhorRank === "SSS" },
  { id: "veteran-week", name: "Uma Semana de Caçador", description: "7 dias desde que virou caçador", icon: "🗓️", check: (s) => s.accountAgeDays >= 7 },
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
