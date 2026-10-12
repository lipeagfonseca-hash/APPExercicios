// ============================================================================
// CONFIGURAÇÃO DE XP
// ----------------------------------------------------------------------------
// Valores de progressão. Alterar aqui não exige mexer em lógica.
// ============================================================================

/** XP ao concluir o treino do dia (concedido uma única vez por dia, no servidor). */
export const XP_POR_TREINO_CONCLUIDO = 50;

/**
 * Fração mínima da duração do treino que precisa ter passado entre "Iniciar" e
 * "Concluir". Impede ganhar XP clicando em "Pular" até o fim.
 * Ex.: treino de 575 s com 0,9 → mínimo de 517 s.
 */
export const FRACAO_MINIMA_DA_DURACAO = 0.9;
