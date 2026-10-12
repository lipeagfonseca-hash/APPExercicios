export const RANKS = ["E", "D", "C", "B", "A", "S"] as const;
export type Rank = (typeof RANKS)[number];

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function rankFromLevel(level: number): Rank {
  if (level >= 50) return "S";
  if (level >= 40) return "A";
  if (level >= 30) return "B";
  if (level >= 20) return "C";
  if (level >= 10) return "D";
  return "E";
}

export function applyXp(
  currentLevel: number,
  currentXp: number,
  gained: number,
): { level: number; xp: number; levelsGained: number } {
  let level = currentLevel;
  let xp = currentXp + gained;
  let levelsGained = 0;

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    levelsGained += 1;
  }

  return { level, xp, levelsGained };
}
