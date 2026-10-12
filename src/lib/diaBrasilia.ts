// ============================================================================
// DIA DE BRASÍLIA
// ----------------------------------------------------------------------------
// Para a rotina de treino, o "dia" vira à 00h do horário de Brasília
// (America/Sao_Paulo), e não à 00h UTC. Um dia é sempre uma string "AAAA-MM-DD",
// o que evita qualquer ambiguidade de fuso ao guardar no banco ou comparar.
//
// Módulo puro (sem imports de alias) para poder ser testado com `node --test`.
// ============================================================================

export type Dia = string; // Ex.: "2026-10-12"

const FUSO_DE_BRASILIA = "America/Sao_Paulo";

const formatadorDeDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_DE_BRASILIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatadorDeHora = new Intl.DateTimeFormat("en-GB", {
  timeZone: FUSO_DE_BRASILIA,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Dia (em Brasília) em que o instante cai. Ex.: 2026-10-13T02:00Z → "2026-10-12" (23h em Brasília). */
export function diaDeBrasilia(instante: Date = new Date()): Dia {
  return formatadorDeDia.format(instante);
}

/** Soma (ou subtrai) dias a um dia. Ex.: somarDias("2026-10-31", 1) → "2026-11-01". */
export function somarDias(dia: Dia, quantidade: number): Dia {
  const [ano, mes, diaDoMes] = dia.split("-").map(Number);
  const instante = Date.UTC(ano, mes - 1, diaDoMes) + quantidade * 86_400_000;
  return new Date(instante).toISOString().slice(0, 10);
}

/** Quantos dias de `inicio` até `fim`. Ex.: diferencaEmDias("2026-10-10", "2026-10-12") → 2. */
export function diferencaEmDias(inicio: Dia, fim: Dia): number {
  const para = (dia: Dia) => {
    const [ano, mes, diaDoMes] = dia.split("-").map(Number);
    return Date.UTC(ano, mes - 1, diaDoMes);
  };
  return Math.round((para(fim) - para(inicio)) / 86_400_000);
}

/** Segundos que faltam para a próxima 00h de Brasília. */
export function segundosAteMeiaNoite(instante: Date = new Date()): number {
  const [hora, minuto, segundo] = formatadorDeHora
    .format(instante)
    .split(":")
    .map(Number);
  return 86_400 - (hora * 3600 + minuto * 60 + segundo);
}

/** Hora cheia (0 a 23) no relógio de Brasília. Ex.: 2026-10-13T21:30:00Z → 18. */
export function horaDeBrasilia(instante: Date = new Date()): number {
  return Number(formatadorDeHora.format(instante).split(":")[0]);
}
