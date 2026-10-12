// ============================================================================
// CONFIGURAÇÃO DA ROTAÇÃO
// ----------------------------------------------------------------------------
// ÚNICO lugar que define a ordem dos treinos. Para mudar a rotina, edite só
// a lista abaixo: nenhuma lógica precisa mudar.
//
//   - Use os ids de src/config/treinos.ts ("A", "B", "C", "D", ...).
//   - "DESCANSO" é um dia de recuperação (alongamentos, sem XP fácil).
//   - Depois do último item, a rotação volta ao primeiro.
//
// Exemplos:
//   ["A", "B", "DESCANSO", "C", "D", "DESCANSO"]   ← rotina atual
//   ["A", "DESCANSO", "B", "DESCANSO"]             ← mais leve
// ============================================================================

export const ID_DO_DESCANSO = "DESCANSO";

export const SEQUENCIA_DA_ROTACAO: readonly string[] = [
  "A",
  "B",
  ID_DO_DESCANSO,
  "C",
  "D",
  ID_DO_DESCANSO,
];
