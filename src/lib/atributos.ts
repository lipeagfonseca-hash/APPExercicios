// ============================================================================
// ATRIBUTOS (STR, AGI, END, VIT) — calculados de dados reais
// ----------------------------------------------------------------------------
// Nada é "inventado" nem acumulado por conta própria: os atributos são
// recalculados do histórico de treinos concluídos.
//
//   STR (força)         = base + minutos de esforço em exercícios de força
//   AGI (agilidade)     = base + minutos de esforço em exercícios de agilidade/mobilidade
//   END (resistência)   = base + minutos de cardio + minutos de pausas ativas
//   VIT (vitalidade)    = base + treinos concluídos + melhor sequência de treinos seguidos
//
// Ex.: 30 min de exercícios de força → STR 40 (base 10 + 30).
// ============================================================================

import { PONTOS_BASE_DOS_ATRIBUTOS } from "../config/xp.ts";
import type { Esforco } from "./esforco.ts";

export type Atributo = "STR" | "AGI" | "END" | "VIT";

export const DESCRICAO_DOS_ATRIBUTOS: Record<Atributo, { nome: string; comoCresce: string }> = {
  STR: { nome: "Força", comoCresce: "1 ponto por minuto de esforço em exercícios de força" },
  AGI: { nome: "Agilidade", comoCresce: "1 ponto por minuto de esforço em agilidade e mobilidade" },
  END: { nome: "Resistência", comoCresce: "1 ponto por minuto de cardio e de pausas ativas" },
  VIT: { nome: "Vitalidade", comoCresce: "1 ponto por treino concluído e 1 por treino da melhor sequência" },
};

export function calcularAtributos(entrada: {
  esforco: Esforco;
  /** Atributo de cada exercício pelo nome (ver src/config/exercicios.ts). */
  atributoPorExercicio: Record<string, "STR" | "AGI" | "END">;
  treinosConcluidos: number;
  melhorSequencia: number;
}): Record<Atributo, number> {
  const segundos: Record<"STR" | "AGI" | "END", number> = { STR: 0, AGI: 0, END: 0 };
  for (const [nome, s] of Object.entries(entrada.esforco.porExercicio)) {
    const atributo = entrada.atributoPorExercicio[nome];
    if (atributo) segundos[atributo] += s;
  }
  segundos.END += entrada.esforco.pausaSegundos;

  const base = PONTOS_BASE_DOS_ATRIBUTOS;
  return {
    STR: base + Math.floor(segundos.STR / 60),
    AGI: base + Math.floor(segundos.AGI / 60),
    END: base + Math.floor(segundos.END / 60),
    VIT: base + entrada.treinosConcluidos + entrada.melhorSequencia,
  };
}
