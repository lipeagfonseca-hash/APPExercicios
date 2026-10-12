// ============================================================================
// CONFIGURAÇÃO DE XP E PROGRESSÃO
// ----------------------------------------------------------------------------
// META DE DESIGN: sair da classe E e chegar à classe S em 1 ANO de treino
// ininterrupto (sem faltar nenhum treino da rotação).
//
// A conta (ciclo de 6 dias com 4 treinos: A, B, descanso, C, D, descanso):
//   - a classe S começa no nível 50 → são 49 subidas de nível;
//   - o treino de número 244 cai no dia 365;
//   - XP acumulado após n treinos = 100·n + 200·⌊n/5⌋  (bônus a cada 5 seguidos);
//   - 49 níveis × 690 XP = 33.810 XP, alcançado no treino 243 → dia 364.
//   Na prática: 1 nível a cada 5 treinos (cerca de 7 a 8 dias).
//
// Para mudar a dificuldade, edite SÓ os números abaixo. O teste
// src/lib/progressao.test.ts simula um ano perfeito e falha se a classe S
// deixar de ser alcançada entre os dias 340 e 365.
//
// Faltar treino quebra a sequência (perde o bônus) e atrasa a subida. O
// descanso e os alongamentos NÃO dão XP e NÃO quebram a sequência.
// ============================================================================

/** XP ao concluir o treino do dia (concedido uma única vez por dia, no servidor). */
export const XP_POR_TREINO_CONCLUIDO = 100;

/** Bônus a cada N treinos seguidos sem falha (5º, 10º, 15º...). */
export const BONUS_POR_SEQUENCIA = {
  aCadaTreinosSeguidos: 5,
  xp: 200,
} as const;

/**
 * XP necessário para subir de nível, por faixa de nível (a primeira faixa cujo
 * `ateNivel` seja >= ao nível atual vale). Ex.: no nível 3 → 690 XP para o nível 4.
 * Para uma curva progressiva, acrescente faixas:
 *   { ateNivel: 9, xpParaSubir: 600 }, { ateNivel: Infinity, xpParaSubir: 700 }
 */
export const FAIXAS_DE_XP_POR_NIVEL: readonly { ateNivel: number; xpParaSubir: number }[] = [
  { ateNivel: Infinity, xpParaSubir: 690 },
];

/** Nível em que cada classe começa. A mais baixa é E; a mais alta é S. */
export const NIVEL_INICIAL_DE_CADA_CLASSE = [
  { classe: "E", nivel: 1 },
  { classe: "D", nivel: 10 },
  { classe: "C", nivel: 20 },
  { classe: "B", nivel: 30 },
  { classe: "A", nivel: 40 },
  { classe: "S", nivel: 50 },
] as const;

/**
 * Fração mínima da duração do treino que precisa ter passado entre "Iniciar" e
 * "Concluir". Impede ganhar XP clicando em "Pular" até o fim.
 * Ex.: treino de 575 s com 0,9 → mínimo de 518 s.
 */
export const FRACAO_MINIMA_DA_DURACAO = 0.9;
