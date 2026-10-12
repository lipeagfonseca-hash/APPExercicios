// ============================================================================
// TIPOS DOS PROGRAMAS DE TREINO
// ----------------------------------------------------------------------------
// Os treinos em si são definidos em src/config/treinos.ts (por ids de exercício)
// e montados em `Program` por src/lib/montarTreino.ts. Aqui ficam só os tipos
// que o cronômetro e as telas consomem.
// ============================================================================

export type ProgramExercise = {
  name: string;
  type: "STRENGTH" | "CARDIO";
  sets: { reps: number; weightKg: number | null }[];
};

/** Treino por tempo: blocos de exercícios separados por pausas ativas. */
export type TimedPlan = {
  /** Segundos de esforço padrão de cada exercício. */
  workSeconds: number;
  /** Segundos de troca entre um exercício e o seguinte. */
  transitionSeconds: number;
  /** Segundos da pausa ativa entre blocos. */
  pauseSeconds: number;
  /** Nome do exercício feito durante a pausa ativa (ex.: marcha estática). */
  pauseExercise: string;
  /** Segundos de preparo antes do primeiro exercício. */
  prepareSeconds: number;
  /** Duração própria de algum exercício, quando diferente de `workSeconds`. */
  secondsByExercise?: Record<string, number>;
  /** Nomes dos exercícios, bloco a bloco. */
  blocks: string[][];
};

export type Program = {
  id: string;
  name: string;
  className: string;
  difficulty: "E" | "D" | "C" | "B" | "A";
  description: string;
  exercises: ProgramExercise[];
  timed?: TimedPlan;
};
