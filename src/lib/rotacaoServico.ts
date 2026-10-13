// ============================================================================
// SERVIÇO DA ROTAÇÃO (servidor)
// ----------------------------------------------------------------------------
// Liga as regras puras (rotacao.ts) ao banco. É AQUI que o treino do dia é
// decidido e que o XP é concedido: o cliente nunca decide nada disso.
// ============================================================================

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { applyXp, rankFromLevel, xpForLevel } from "@/lib/leveling";
import { diaDeBrasilia, type Dia } from "@/lib/diaBrasilia";
import {
  descreverEstadoDoDia,
  normalizarPonteiro,
  ponteiroAposConcluir,
  sequenciaAposConcluir,
  sequenciaExibida,
  type EstadoDoDia,
  type Ponteiro,
} from "@/lib/rotacao";
import { SEQUENCIA_DA_ROTACAO } from "@/config/rotacao";
import { duracaoTotalEmSegundos } from "@/config/treinos";
import { FRACAO_MINIMA_DA_DURACAO } from "@/config/xp";
import { treinosParaOProximoBonus, xpDoTreino } from "@/lib/progressao";

// ----------------------------------------------------------------------------
// Erros de regra de negócio (a rota converte em resposta HTTP)
// ----------------------------------------------------------------------------

export type CodigoDeErro = "SEM_TREINO_HOJE" | "JA_CONCLUIDO" | "NAO_INICIADO" | "TEMPO_INSUFICIENTE";

export class ErroDeRotacao extends Error {
  constructor(
    public codigo: CodigoDeErro,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

// ----------------------------------------------------------------------------
// Leitura: o que o usuário vê hoje
// ----------------------------------------------------------------------------

export type VisaoDoDia = {
  hoje: Dia;
  estado: EstadoDoDia;
  ponteiro: Ponteiro;
  /** Treinos seguidos sem falha (0 se há treino atrasado). */
  sequenciaAtual: number;
  melhorSequencia: number;
  /** Quantos treinos seguidos faltam para o próximo bônus de XP (1 a 5). */
  treinosParaOBonus: number;
  nivel: number;
  xp: number;
  xpParaProximoNivel: number;
  treinoIniciado: boolean;
};

/**
 * Cria o perfil do primeiro acesso. No primeiro acesso de uma conta nova chegam vários
 * pedidos ao mesmo tempo (menu e página); se outro pedido criou o perfil antes, a
 * restrição UNIQUE(userId) avisa (P2002) e basta ler o que já existe.
 */
async function criarPerfil(userId: string) {
  try {
    return await prisma.playerProfile.create({ data: { userId } });
  } catch (erro) {
    if (typeof erro === "object" && erro && "code" in erro && erro.code === "P2002") {
      return prisma.playerProfile.findUniqueOrThrow({ where: { userId } });
    }
    throw erro;
  }
}

async function calcularVisaoDoDia(userId: string, agora: Date): Promise<VisaoDoDia> {
  const hoje = diaDeBrasilia(agora);

  // Caso comum: 1 leitura. Só cria o perfil se ele ainda não existir (primeiro acesso).
  const perfil =
    (await prisma.playerProfile.findUnique({ where: { userId } })) ?? (await criarPerfil(userId));

  // Perfil novo ainda não tem dia de início: a rotação começa hoje, no Treino 1.
  const ponteiroGuardado: Ponteiro = {
    posicao: perfil.posicaoRotacao % SEQUENCIA_DA_ROTACAO.length,
    itemDesde: perfil.itemDesde ?? hoje,
  };

  // Descanso que já passou avança sozinho (posição 2 = Descanso → vira o Treino C no dia seguinte).
  const { ponteiro, mudou } = normalizarPonteiro(SEQUENCIA_DA_ROTACAO, ponteiroGuardado, hoje);
  if (mudou || perfil.itemDesde === null) {
    await prisma.playerProfile.update({
      where: { userId },
      data: { posicaoRotacao: ponteiro.posicao, itemDesde: ponteiro.itemDesde },
    });
  }

  const estado = descreverEstadoDoDia(SEQUENCIA_DA_ROTACAO, ponteiro, hoje);
  const diasEmAtraso = estado.tipo === "TREINO_PENDENTE" ? estado.diasEmAtraso : 0;

  return {
    hoje,
    estado,
    ponteiro,
    sequenciaAtual: sequenciaExibida(perfil.streakDays, diasEmAtraso),
    melhorSequencia: perfil.bestStreakDays,
    treinosParaOBonus: treinosParaOProximoBonus(sequenciaExibida(perfil.streakDays, diasEmAtraso)),
    nivel: perfil.level,
    xp: perfil.xp,
    xpParaProximoNivel: xpForLevel(perfil.level),
    treinoIniciado:
      estado.tipo === "TREINO_PENDENTE" &&
      perfil.sessaoTreinoId === estado.item &&
      perfil.sessaoIniciadaEm !== null,
  };
}

/** Visão do dia, calculada uma única vez por requisição (AppShell e páginas compartilham). */
export const carregarVisaoDoDia = cache((userId: string) => calcularVisaoDoDia(userId, new Date()));

// ----------------------------------------------------------------------------
// Escrita: iniciar e concluir o treino do dia
// ----------------------------------------------------------------------------

/** Marca o horário em que o usuário apertou INICIAR TREINO (base da validação de tempo). */
export async function registrarInicioDoTreino(userId: string) {
  const agora = new Date();
  const visao = await calcularVisaoDoDia(userId, agora);

  if (visao.estado.tipo === "TREINO_CONCLUIDO_HOJE") {
    throw new ErroDeRotacao("JA_CONCLUIDO", "O treino de hoje já foi concluído.");
  }
  if (visao.estado.tipo !== "TREINO_PENDENTE") {
    throw new ErroDeRotacao("SEM_TREINO_HOJE", "Hoje é dia de descanso.");
  }

  await prisma.playerProfile.update({
    where: { userId },
    data: { sessaoIniciadaEm: agora, sessaoTreinoId: visao.estado.item },
  });
  return { treinoId: visao.estado.item };
}

export type ResultadoDaConclusao = {
  treinoId: string;
  /** XP total concedido (base + bônus de sequência). */
  xpGanho: number;
  xpBase: number;
  xpBonus: number;
  subiuDeNivel: boolean;
  niveisGanhos: number;
  nivel: number;
  xp: number;
  xpParaProximoNivel: number;
  rank: ReturnType<typeof rankFromLevel>;
  sequenciaAtual: number;
};

function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return typeof erro === "object" && erro !== null && (erro as { code?: string }).code === "P2002";
}

/**
 * Conclui o treino do dia. Tudo é validado aqui, dentro de uma transação:
 *  - existe treino pendente hoje (não é descanso nem já concluído);
 *  - o usuário iniciou ESTE treino e esperou pelo menos 90% da duração;
 *  - UNIQUE(userId, dia) no banco impede XP duplicado (clique duplo, recarga, duas abas).
 */
export async function concluirTreinoDoDia(userId: string): Promise<ResultadoDaConclusao> {
  const agora = new Date();
  const hoje = diaDeBrasilia(agora);

  try {
    return await prisma.$transaction(async (tx) => {
      const perfil = await tx.playerProfile.findUnique({ where: { userId } });
      if (!perfil) throw new ErroDeRotacao("NAO_INICIADO", "Inicie o treino antes de concluir.");

      const ponteiroGuardado: Ponteiro = {
        posicao: perfil.posicaoRotacao % SEQUENCIA_DA_ROTACAO.length,
        itemDesde: perfil.itemDesde ?? hoje,
      };
      const { ponteiro } = normalizarPonteiro(SEQUENCIA_DA_ROTACAO, ponteiroGuardado, hoje);
      const estado = descreverEstadoDoDia(SEQUENCIA_DA_ROTACAO, ponteiro, hoje);

      if (estado.tipo === "TREINO_CONCLUIDO_HOJE") {
        throw new ErroDeRotacao("JA_CONCLUIDO", "O treino de hoje já foi concluído.");
      }
      if (estado.tipo !== "TREINO_PENDENTE") {
        throw new ErroDeRotacao("SEM_TREINO_HOJE", "Hoje é dia de descanso.");
      }

      // Validação de tempo: o cronômetro tem que ter rodado de verdade.
      if (perfil.sessaoTreinoId !== estado.item || !perfil.sessaoIniciadaEm) {
        throw new ErroDeRotacao("NAO_INICIADO", "Inicie o treino antes de concluir.");
      }
      const duracaoTotal = duracaoTotalEmSegundos(estado.item);
      const minimo = Math.ceil(duracaoTotal * FRACAO_MINIMA_DA_DURACAO);
      const decorrido = Math.floor((agora.getTime() - perfil.sessaoIniciadaEm.getTime()) / 1000);
      if (decorrido < minimo) {
        throw new ErroDeRotacao(
          "TEMPO_INSUFICIENTE",
          `Treino concluído rápido demais (${decorrido}s de ${minimo}s). Refaça o treino completo.`,
        );
      }

      // XP do treino: base + bônus a cada 5 treinos seguidos (ex.: 5º treino seguido → 100 + 200).
      const novaSequencia = sequenciaAposConcluir(perfil.streakDays, estado.diasEmAtraso);
      const xpGanho = xpDoTreino(novaSequencia);

      // Registro do dia. Se já existir, o UNIQUE do banco lança P2002 (tratado abaixo).
      await tx.treinoConcluido.create({
        data: {
          userId,
          dia: hoje,
          treinoId: estado.item,
          posicao: ponteiro.posicao,
          xpConcedido: xpGanho.total,
          duracaoSegundos: decorrido,
        },
      });

      const { level, xp, levelsGained } = applyXp(perfil.level, perfil.xp, xpGanho.total);
      const proximo = ponteiroAposConcluir(SEQUENCIA_DA_ROTACAO, ponteiro, hoje);

      await tx.playerProfile.update({
        where: { userId },
        data: {
          level,
          xp,
          streakDays: novaSequencia,
          bestStreakDays: Math.max(perfil.bestStreakDays, novaSequencia),
          lastActivityDate: agora,
          posicaoRotacao: proximo.posicao,
          itemDesde: proximo.itemDesde,
          sessaoIniciadaEm: null,
          sessaoTreinoId: null,
        },
      });

      await tx.systemLog.create({
        data: {
          profileId: perfil.id,
          tag: "SISTEMA: TREINO CONCLUÍDO",
          message:
            `Treino ${estado.item} concluído. +${xpGanho.total} XP` +
            (xpGanho.bonus > 0 ? ` (inclui +${xpGanho.bonus} de bônus por ${novaSequencia} treinos seguidos).` : "."),
        },
      });

      return {
        treinoId: estado.item,
        xpGanho: xpGanho.total,
        xpBase: xpGanho.base,
        xpBonus: xpGanho.bonus,
        subiuDeNivel: levelsGained > 0,
        niveisGanhos: levelsGained,
        nivel: level,
        xp,
        xpParaProximoNivel: xpForLevel(level),
        rank: rankFromLevel(level),
        sequenciaAtual: novaSequencia,
      };
    });
  } catch (erro) {
    if (ehViolacaoDeUnicidade(erro)) {
      throw new ErroDeRotacao("JA_CONCLUIDO", "O treino de hoje já foi concluído.");
    }
    throw erro;
  }
}
