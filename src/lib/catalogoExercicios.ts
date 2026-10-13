// ============================================================================
// CATÁLOGO ESTÁTICO DE EXERCÍCIOS
// ----------------------------------------------------------------------------
// O catálogo não muda entre deploys, então é lido UMA vez (escopo de módulo) de
// um JSON versionado, em vez de ser buscado no banco a cada requisição.
// Para regenerar o arquivo: node scripts/gerar-catalogo.cjs
//
// Só para o servidor (o JSON tem ~440 KB; não importe em componentes "use client").
// ============================================================================

import catalogoBruto from "../data/catalogo-exercicios.json";

export type ExercicioDoCatalogo = {
  id: string;
  nome: string;
  nomeEn: string;
  regiao: string;
  equipamento: string;
  alvo: string;
  secundarios: string[];
  instrucoesPt: string;
  instrucoesEn: string | null;
  instrucoesEs: string | null;
  /** Texto de busca já normalizado (sem acento, minúsculo). */
  busca: string;
};

const catalogo = catalogoBruto as ExercicioDoCatalogo[];

/** Índice por id, montado uma vez por instância da função. */
export const catalogoExerciciosPorId: ReadonlyMap<string, ExercicioDoCatalogo> = new Map(
  catalogo.map((e) => [e.id, e]),
);

/** Resumo leve de cada exercício (sem as instruções), para a galeria. */
export const resumoDoCatalogo = catalogo.map(({ id, nome, nomeEn, regiao, equipamento, alvo }) => ({
  id,
  name: nome,
  nameEn: nomeEn,
  bodyPart: regiao,
  equipment: equipamento,
  target: alvo,
}));
