// ============================================================================
// CONFIGURAÇÃO DOS TREINOS (A, B, C, D) E DA ROTINA DE ALONGAMENTO
// ----------------------------------------------------------------------------
// Aqui se define QUAIS exercícios entram em cada treino (por id, de
// src/config/exercicios.ts). Os tempos ficam em parametrosDeTempo.ts.
//
// Todo treino segue o mesmo formato HIIT por tempo, de baixo impacto:
//   preparo → bloco 1 → pausa ativa → bloco 2 → pausa ativa → bloco 3
//   (cada bloco: 4 exercícios; cada exercício: esforço + troca)
//
// Divisão do ciclo:  A = membros inferiores | B = superiores + core
//                    C = corpo todo cardio  | D = core + mobilidade
//
// Para acrescentar um treino: crie a definição abaixo, inclua em TREINOS e use o
// id dele em src/config/rotacao.ts. O build confere os tempos (máx. 10 min).
// ============================================================================

import type { Program } from "../lib/programs.ts";
import {
  duracaoDoPrograma,
  montarDetalhes,
  montarPrograma,
  validarTreinos,
  type DefinicaoDeTreino,
  type DetalheDoExercicio,
} from "../lib/montarTreino.ts";
import { validarSequencia } from "../lib/rotacao.ts";
import { SEQUENCIA_DA_ROTACAO } from "./rotacao.ts";
import { EXERCICIOS } from "./exercicios.ts";
import {
  DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS,
  PARAMETROS_DE_TEMPO,
  PARAMETROS_DO_ALONGAMENTO,
} from "./parametrosDeTempo.ts";

export const DEFINICOES_DOS_TREINOS: DefinicaoDeTreino[] = [
  {
    id: "A",
    nome: "Pernas Seguras",
    foco: "TREINO A · MEMBROS INFERIORES",
    nivel: "E",
    descricao: "Pernas e glúteos protegendo joelhos e tornozelos. Sempre com apoio por perto.",
    blocos: [
      ["agachamento-apoio", "abducao-lateral", "panturrilha", "rosca-perna"],
      ["agachamento-alcance", "ponte-gluteo", "marcha-acelerada", "abducao-lateral"],
      ["agachamento-apoio", "rosca-perna", "panturrilha", "ponte-gluteo"],
    ],
  },
  {
    id: "B",
    nome: "Tronco e Postura",
    foco: "TREINO B · SUPERIORES + CORE",
    nivel: "E",
    descricao: "Peito, costas e abdômen, tudo em pé ou sentado, com apoio na parede ou bancada.",
    blocos: [
      ["flexao-parede", "remada-toalha", "elevacao-pernas-sentado", "arqueiro-em-pe"],
      ["flexao-inclinada", "inclinacao-pelvica", "remada-toalha", "elevacao-pernas-sentado"],
      ["flexao-parede", "arqueiro-em-pe", "inclinacao-pelvica", "remada-toalha"],
    ],
  },
  {
    id: "C",
    nome: "Cardio Suave",
    foco: "TREINO C · CORPO TODO (CARDIO)",
    nivel: "D",
    descricao: "Fôlego e coordenação do corpo todo, sem saltos e sempre com um pé no chão.",
    blocos: [
      ["marcha-acelerada", "arqueiro-em-pe", "rosca-perna", "agachamento-alcance"],
      ["marcha-acelerada", "abducao-lateral", "flexao-parede", "panturrilha"],
      ["marcha-acelerada", "arqueiro-em-pe", "agachamento-apoio", "rosca-perna"],
    ],
  },
  {
    id: "D",
    nome: "Core e Mobilidade",
    foco: "TREINO D · CORE + MOBILIDADE",
    nivel: "D",
    descricao: "Abdômen e coluna com mobilidade de ombros e tronco. Ritmo mais calmo.",
    blocos: [
      ["inclinacao-pelvica", "elevacao-pernas-sentado", "alongamento-lateral", "arqueiro-em-pe"],
      ["elevacao-pernas-sentado", "alongamento-peito", "inclinacao-pelvica", "alongamento-costas"],
      ["arqueiro-em-pe", "alongamento-lateral", "elevacao-pernas-sentado", "alongamento-peito"],
    ],
  },
];

/**
 * Rotina do DIA DE DESCANSO: alongamentos leves, sem XP (não é uma missão).
 * Um único bloco, sem pausas ativas.
 */
export const DEFINICAO_DO_ALONGAMENTO: DefinicaoDeTreino = {
  id: "ALONGAMENTO",
  nome: "Alongamentos de recuperação",
  foco: "DESCANSO · ALONGAMENTO",
  nivel: "E",
  descricao: "Alongamentos suaves para recuperar. Respire fundo e não force. Sem XP: é só cuidado com o corpo.",
  blocos: [
    [
      "alongamento-pescoco",
      "alongamento-peito",
      "alongamento-costas",
      "alongamento-triceps",
      "alongamento-lateral",
      "alongamento-posterior-cadeira",
      "alongamento-panturrilha",
      "circulos-tornozelo",
    ],
  ],
};

// ---------------------------------------------------------------------------
// Montagem (derivada da configuração acima — não editar)
// ---------------------------------------------------------------------------

export const TREINOS: Record<string, Program> = Object.fromEntries(
  DEFINICOES_DOS_TREINOS.map((d) => [d.id, montarPrograma(d, EXERCICIOS, PARAMETROS_DE_TEMPO)]),
);

export const PROGRAMA_DE_ALONGAMENTO: Program = montarPrograma(DEFINICAO_DO_ALONGAMENTO, EXERCICIOS, {
  segundosDeEsforcoPorExercicio: PARAMETROS_DO_ALONGAMENTO.segundosPorAlongamento,
  segundosDeTroca: PARAMETROS_DO_ALONGAMENTO.segundosDeTroca,
  segundosDePausaAtiva: 0, // um bloco só: nunca há pausa ativa
  segundosDePreparo: PARAMETROS_DO_ALONGAMENTO.segundosDePreparo,
  exercicioDaPausaAtiva: PARAMETROS_DE_TEMPO.exercicioDaPausaAtiva,
});

/** Detalhes (GIF, instrução, duração) para a tela, indexados pelo nome do exercício. */
export const DETALHES_DOS_TREINOS: Record<string, DetalheDoExercicio> = montarDetalhes(
  EXERCICIOS,
  PARAMETROS_DE_TEMPO.segundosDeEsforcoPorExercicio,
);
export const DETALHES_DO_ALONGAMENTO: Record<string, DetalheDoExercicio> = montarDetalhes(
  EXERCICIOS,
  PARAMETROS_DO_ALONGAMENTO.segundosPorAlongamento,
);

export function treinoPorId(id: string): Program {
  const treino = TREINOS[id];
  if (!treino) throw new Error(`Treino "${id}" não existe na configuração.`);
  return treino;
}

/** Duração total do treino em segundos (preparo + esforço + trocas + pausas ativas). */
export function duracaoTotalEmSegundos(id: string): number {
  return duracaoDoPrograma(treinoPorId(id));
}

// --- Validações executadas ao carregar o módulo (o build falha se algo estiver errado) ---
validarTreinos(DEFINICOES_DOS_TREINOS, EXERCICIOS, PARAMETROS_DE_TEMPO, DURACAO_MAXIMA_DO_TREINO_EM_SEGUNDOS);
validarSequencia(SEQUENCIA_DA_ROTACAO, Object.keys(TREINOS));
