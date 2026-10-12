// ============================================================================
// ROTAÇÃO DE TREINOS (regras puras)
// ----------------------------------------------------------------------------
// A sequência vem da configuração (src/config/rotacao.ts). Aqui só ficam as
// regras de como o "ponteiro" anda por ela. Nada de banco, nada de React.
//
//   sequência = ["A", "B", "DESCANSO", "C", "D", "DESCANSO"]
//   ponteiro  = { posicao: 0, itemDesde: "2026-10-12" }   → Treino A vale desde 12/10
//
// REGRAS
//  1. Treino NÃO concluído continua pendente nos dias seguintes (não pula).
//  2. Concluir o treino avança o ponteiro; o próximo item só vale a partir de AMANHÃ.
//  3. Dia de descanso passa sozinho: quando o dia vira, o ponteiro avança.
//  4. Descanso nunca quebra a sequência; só um treino atrasado quebra.
// ============================================================================

import { diferencaEmDias, somarDias, type Dia } from "./diaBrasilia.ts";

export const ID_DO_DESCANSO = "DESCANSO";

export type Ponteiro = {
  /** Índice do item atual dentro da sequência. */
  posicao: number;
  /** Primeiro dia em que o item atual vale. */
  itemDesde: Dia;
};

export type EstadoDoDia =
  | { tipo: "TREINO_PENDENTE"; item: string; diasEmAtraso: number }
  | { tipo: "TREINO_CONCLUIDO_HOJE"; proximo: string }
  | { tipo: "DESCANSO" };

function itemNaPosicao(sequencia: readonly string[], posicao: number): string {
  return sequencia[((posicao % sequencia.length) + sequencia.length) % sequencia.length];
}

/** Garante que a sequência é utilizável. Lança erro claro se a configuração estiver errada. */
export function validarSequencia(sequencia: readonly string[], idsDeTreinoValidos: readonly string[]) {
  if (sequencia.length === 0) throw new Error("A sequência da rotação está vazia.");
  if (!sequencia.some((item) => item !== ID_DO_DESCANSO)) {
    throw new Error("A sequência precisa ter pelo menos um treino.");
  }
  for (const item of sequencia) {
    if (item !== ID_DO_DESCANSO && !idsDeTreinoValidos.includes(item)) {
      throw new Error(`A sequência usa o treino "${item}", que não existe na configuração.`);
    }
  }
}

/**
 * Faz o descanso "passar": se o item atual é descanso e o dia dele já acabou,
 * o ponteiro avança (e o próximo item vale a partir de hoje).
 *
 * Ex.: ponteiro no DESCANSO desde 14/10, hoje é 16/10 → avança para o Treino C, desde 16/10.
 */
export function normalizarPonteiro(
  sequencia: readonly string[],
  ponteiro: Ponteiro,
  hoje: Dia,
): { ponteiro: Ponteiro; mudou: boolean } {
  let atual = ponteiro;
  let mudou = false;
  for (let tentativas = 0; tentativas < sequencia.length; tentativas++) {
    const ehDescansoVencido =
      itemNaPosicao(sequencia, atual.posicao) === ID_DO_DESCANSO && hoje > atual.itemDesde;
    if (!ehDescansoVencido) break;
    atual = { posicao: (atual.posicao + 1) % sequencia.length, itemDesde: hoje };
    mudou = true;
  }
  return { ponteiro: atual, mudou };
}

/** O que o usuário vê hoje. Espera um ponteiro já normalizado. */
export function descreverEstadoDoDia(
  sequencia: readonly string[],
  ponteiro: Ponteiro,
  hoje: Dia,
): EstadoDoDia {
  const item = itemNaPosicao(sequencia, ponteiro.posicao);

  // O item atual só vale a partir de amanhã → o de hoje já foi concluído.
  // Ex.: concluiu o Treino A hoje; ponteiro no B desde amanhã.
  if (ponteiro.itemDesde > hoje) {
    return { tipo: "TREINO_CONCLUIDO_HOJE", proximo: item };
  }

  if (item === ID_DO_DESCANSO) return { tipo: "DESCANSO" };

  return {
    tipo: "TREINO_PENDENTE",
    item,
    diasEmAtraso: diferencaEmDias(ponteiro.itemDesde, hoje),
  };
}

/** Novo ponteiro depois de concluir o treino de hoje. O próximo item vale desde amanhã. */
export function ponteiroAposConcluir(
  sequencia: readonly string[],
  ponteiro: Ponteiro,
  hoje: Dia,
): Ponteiro {
  return {
    posicao: (ponteiro.posicao + 1) % sequencia.length,
    itemDesde: somarDias(hoje, 1),
  };
}

/**
 * Projeção dos próximos dias SE nada falhar (usada no calendário).
 * Cada item ocupa um dia: treino concluído no próprio dia, descanso no seu dia.
 * Ex.: ponteiro no C hoje → [C hoje, D amanhã, DESCANSO depois, A, B, ...]
 */
export function projetarProximosDias(
  sequencia: readonly string[],
  ponteiro: Ponteiro,
  hoje: Dia,
  quantidadeDeDias: number,
): { dia: Dia; item: string }[] {
  let dia = ponteiro.itemDesde > hoje ? ponteiro.itemDesde : hoje;
  const projecao: { dia: Dia; item: string }[] = [];
  for (let i = 0; i < quantidadeDeDias; i++) {
    projecao.push({ dia, item: itemNaPosicao(sequencia, ponteiro.posicao + i) });
    dia = somarDias(dia, 1);
  }
  return projecao;
}

/** Sequência de treinos seguidos que o usuário vê (zera se há treino atrasado). */
export function sequenciaExibida(sequenciaGuardada: number, diasEmAtraso: number): number {
  return diasEmAtraso > 0 ? 0 : sequenciaGuardada;
}

/** Sequência depois de concluir: continua se estava em dia, recomeça em 1 se atrasou. */
export function sequenciaAposConcluir(sequenciaGuardada: number, diasEmAtraso: number): number {
  return diasEmAtraso > 0 ? 1 : sequenciaGuardada + 1;
}
