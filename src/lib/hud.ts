export function hpMax(level: number): number {
  return 1000 + level * 140;
}

export function mpMax(level: number): number {
  return 500 + level * 70;
}

export function computeFadiga(totalRepsToday: number): number {
  return Math.min(100, Math.round(totalRepsToday / 5));
}
