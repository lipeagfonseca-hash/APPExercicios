// ============================================================================
// Atalhos de compatibilidade para as telas e serviços que já usam estes nomes.
// A lógica de verdade está em progressao.ts e os números em config/xp.ts.
// ============================================================================

import { aplicarXp, classeDoNivel, xpParaSubirDeNivel, type Classe } from "./progressao.ts";

export type Rank = Classe;
export const rankFromLevel = classeDoNivel;
export const xpForLevel = xpParaSubirDeNivel;

export function applyXp(currentLevel: number, currentXp: number, gained: number) {
  const { nivel, xp, niveisGanhos } = aplicarXp(currentLevel, currentXp, gained);
  return { level: nivel, xp, levelsGained: niveisGanhos };
}
