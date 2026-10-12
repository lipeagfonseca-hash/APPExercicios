// ============================================================================
// AQUECIMENTO (regras puras)
// ============================================================================

import { createHash, timingSafeEqual } from "node:crypto";
import { horaDeBrasilia } from "./diaBrasilia.ts";

export type JanelaDeAquecimento = { readonly deHora: number; readonly ateHora: number };

/**
 * Está dentro de alguma janela? A hora inicial vale e a final não.
 * Ex.: janela 18–21 → 18:00 sim, 20:59 sim, 21:00 não.
 */
export function dentroDaJanelaDeAquecimento(
  janelas: readonly JanelaDeAquecimento[],
  instante: Date = new Date(),
): boolean {
  const hora = horaDeBrasilia(instante);
  return janelas.some((j) => hora >= j.deHora && hora < j.ateHora);
}

/** Soma de horas por dia das janelas (para a conta da cota do Neon). */
export function horasDeAquecimentoPorDia(janelas: readonly JanelaDeAquecimento[]): number {
  return janelas.reduce((soma, j) => soma + (j.ateHora - j.deHora), 0);
}

/** Compara dois segredos sem vazar, pelo tempo de resposta, onde eles diferem. */
export function segredosIguais(recebido: string, esperado: string): boolean {
  const hash = (texto: string) => createHash("sha256").update(texto).digest();
  return timingSafeEqual(hash(recebido), hash(esperado));
}

/** Extrai o token de um cabeçalho "Authorization: Bearer xxx" (ou "" se não houver). */
export function tokenDoBearer(cabecalho: string | null): string {
  return cabecalho?.match(/^Bearer\s+(.+)$/i)?.[1] ?? "";
}
