// ============================================================================
// PROGRESSÃO: XP, NÍVEIS E CLASSES (regras puras)
// ----------------------------------------------------------------------------
// Todos os números vêm de src/config/xp.ts. Aqui só ficam as contas.
// Sem banco e sem React, para poder ser testado com `npm test`.
// ============================================================================

import {
  BONUS_POR_SEQUENCIA,
  FAIXAS_DE_XP_POR_NIVEL,
  NIVEL_INICIAL_DE_CADA_CLASSE,
  XP_POR_TREINO_CONCLUIDO,
} from "../config/xp.ts";

export type Classe = (typeof NIVEL_INICIAL_DE_CADA_CLASSE)[number]["classe"];

/** XP para sair do `nivel` e ir para o próximo. Ex.: xpParaSubirDeNivel(3) → 690. */
export function xpParaSubirDeNivel(nivel: number): number {
  const faixa = FAIXAS_DE_XP_POR_NIVEL.find((f) => nivel <= f.ateNivel);
  if (!faixa) throw new Error(`Nenhuma faixa de XP cobre o nível ${nivel}.`);
  return faixa.xpParaSubir;
}

/** Classe do jogador. Ex.: nível 9 → "E"; nível 10 → "D"; nível 50 → "S". */
export function classeDoNivel(nivel: number): Classe {
  let classe: Classe = NIVEL_INICIAL_DE_CADA_CLASSE[0].classe;
  for (const faixa of NIVEL_INICIAL_DE_CADA_CLASSE) {
    if (nivel >= faixa.nivel) classe = faixa.classe;
  }
  return classe;
}

/**
 * XP de um treino concluído.
 * `sequenciaAposConcluir` = nº de treinos seguidos incluindo este.
 * Ex.: 4º treino seguido → 100 (sem bônus); 5º → 100 + 200 de bônus.
 */
export function xpDoTreino(sequenciaAposConcluir: number): { base: number; bonus: number; total: number } {
  const base = XP_POR_TREINO_CONCLUIDO;
  const ganhaBonus =
    sequenciaAposConcluir > 0 && sequenciaAposConcluir % BONUS_POR_SEQUENCIA.aCadaTreinosSeguidos === 0;
  const bonus = ganhaBonus ? BONUS_POR_SEQUENCIA.xp : 0;
  return { base, bonus, total: base + bonus };
}

/** Quantos treinos seguidos faltam para o próximo bônus (1 a 5). Ex.: sequência 3 → 2. */
export function treinosParaOProximoBonus(sequenciaAtual: number): number {
  const passo = BONUS_POR_SEQUENCIA.aCadaTreinosSeguidos;
  return passo - (sequenciaAtual % passo);
}

/** Soma o XP ganho e sobe quantos níveis forem necessários. */
export function aplicarXp(
  nivelAtual: number,
  xpAtual: number,
  ganho: number,
): { nivel: number; xp: number; niveisGanhos: number } {
  let nivel = nivelAtual;
  let xp = xpAtual + ganho;
  let niveisGanhos = 0;
  while (xp >= xpParaSubirDeNivel(nivel)) {
    xp -= xpParaSubirDeNivel(nivel);
    nivel += 1;
    niveisGanhos += 1;
  }
  return { nivel, xp, niveisGanhos };
}
