// ============================================================================
// ESTATÍSTICAS DO JOGADOR (servidor)
// ----------------------------------------------------------------------------
// Tudo é calculado do histórico REAL de treinos concluídos (tabela
// TreinoConcluido). Nenhum número é inventado nem guardado à parte.
// ============================================================================

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { EXERCICIOS } from "@/config/exercicios";
import { TREINOS } from "@/config/treinos";
import { calcularAtributos } from "@/lib/atributos";
import { somarEsforco } from "@/lib/esforco";
import { calcularRanks } from "@/lib/rank";

const ATRIBUTO_POR_EXERCICIO = Object.fromEntries(
  Object.values(EXERCICIOS).map((e) => [e.nome, e.atributo]),
) as Record<string, "STR" | "AGI" | "END">;

/** Estatísticas calculadas uma única vez por requisição. */
export const carregarEstatisticas = cache(async (userId: string) => {
  const [perfil, grupos] = await Promise.all([
    prisma.playerProfile.upsert({ where: { userId }, update: {}, create: { userId } }),
    prisma.treinoConcluido.groupBy({ by: ["treinoId"], where: { userId }, _count: { _all: true } }),
  ]);

  const execucoesPorTreino = Object.fromEntries(grupos.map((g) => [g.treinoId, g._count._all]));
  const treinosConcluidos = grupos.reduce((soma, g) => soma + g._count._all, 0);
  const esforco = somarEsforco(execucoesPorTreino, TREINOS);

  return {
    perfil,
    treinosConcluidos,
    esforco,
    minutosDeEsforco: Math.round(esforco.totalSegundos / 60),
    atributos: calcularAtributos({
      esforco,
      atributoPorExercicio: ATRIBUTO_POR_EXERCICIO,
      treinosConcluidos,
      melhorSequencia: perfil.bestStreakDays,
    }),
    ranks: calcularRanks(esforco.porExercicio),
  };
});
