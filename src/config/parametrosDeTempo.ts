// ============================================================================
// PARÂMETROS DE TEMPO DOS TREINOS
// ----------------------------------------------------------------------------
// Tudo que é "quantos segundos" fica aqui. As próximas progressões devem mexer
// SÓ neste arquivo: aumentar o esforço ou reduzir a pausa. Nenhum treino precisa
// ser reescrito.
//
// ATENÇÃO: nenhum treino pode passar de DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS.
// O build falha (com uma mensagem explicando) se isso acontecer. Ao subir o
// esforço, reduza a pausa ou o número de blocos para continuar dentro do limite.
//
// Conta atual de um treino (3 blocos de 4 exercícios):
//   5 (preparo) + 3 × (4 × 30 esforço + 3 × 10 troca) + 2 × 60 (pausas) = 575 s = 09:35
// ============================================================================

export const PARAMETROS_DE_TEMPO = {
  /** Segundos de esforço de cada exercício. */
  segundosDeEsforcoPorExercicio: 30,
  /** Segundos de troca entre um exercício e o próximo (dentro do bloco). */
  segundosDeTroca: 10,
  /** Segundos da pausa ativa entre os blocos. */
  segundosDePausaAtiva: 60,
  /** Segundos de preparo antes de começar. */
  segundosDePreparo: 5,
  /** Exercício feito na pausa ativa (id em src/config/exercicios.ts). */
  exercicioDaPausaAtiva: "marcha-estatica",
} as const;

/** Limite de cada treino, contando preparo, trocas e pausas ativas (10 minutos). */
export const DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS = 600;

/** Rotina de alongamento do dia de descanso (sem XP, sem limite de 10 min). */
export const PARAMETROS_DO_ALONGAMENTO = {
  segundosPorAlongamento: 30,
  segundosDeTroca: 5,
  segundosDePreparo: 5,
} as const;
