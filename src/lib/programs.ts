export type ProgramExercise = {
  name: string;
  type: "STRENGTH" | "CARDIO";
  sets: { reps: number; weightKg: number | null }[];
};

// Time-based circuit: blocks of exercises separated by active-recovery pauses.
export type TimedPlan = {
  workSeconds: number;
  transitionSeconds: number;
  pauseSeconds: number;
  pauseExercise: string;
  blocks: string[][];
};

export type ProgramTrack = "low-impact" | "classic";

export type Program = {
  id: string;
  track: ProgramTrack;
  timed?: TimedPlan;
  name: string;
  className: string;
  difficulty: "E" | "D" | "C" | "B" | "A";
  description: string;
  exercises: ProgramExercise[];
};

function rounds(reps: number, count = 3) {
  return Array.from({ length: count }, () => ({ reps, weightKg: null }));
}

const CLASSIC_PROGRAMS: Program[] = [
  {
    id: "hiit-q48-a",
    track: "classic",
    name: "Circuito Fogo",
    className: "HIIT Q48 • Dia A",
    difficulty: "C",
    description:
      "Circuito de alta intensidade, 3 rounds, sem equipamento. Descanse 20s entre exercícios e 1min entre rounds.",
    exercises: [
      { name: "Polichinelo", type: "CARDIO", sets: rounds(40) },
      { name: "Burpee", type: "CARDIO", sets: rounds(12) },
      { name: "Agachamento com salto", type: "STRENGTH", sets: rounds(15) },
      { name: "Prancha com toque de ombro", type: "STRENGTH", sets: rounds(20) },
      { name: "Mountain climber", type: "CARDIO", sets: rounds(30) },
      { name: "Corrida parada (joelho alto)", type: "CARDIO", sets: rounds(40) },
    ],
  },
  {
    id: "hiit-q48-b",
    track: "classic",
    name: "Circuito Lâmina",
    className: "HIIT Q48 • Dia B",
    difficulty: "C",
    description:
      "Circuito de alta intensidade, 3 rounds, foco em core e explosão de pernas.",
    exercises: [
      { name: "Afundo alternado com salto", type: "STRENGTH", sets: rounds(16) },
      { name: "Flexão", type: "STRENGTH", sets: rounds(15) },
      { name: "Abdominal bicicleta", type: "STRENGTH", sets: rounds(20) },
      { name: "Prancha lateral", type: "STRENGTH", sets: rounds(20) },
      { name: "Skater jump", type: "CARDIO", sets: rounds(20) },
      { name: "Agachamento sumô com salto", type: "STRENGTH", sets: rounds(15) },
    ],
  },
  {
    id: "hiit-q48-c",
    track: "classic",
    name: "Circuito Tempestade",
    className: "HIIT Q48 • Dia C",
    difficulty: "B",
    description:
      "Circuito de alta intensidade, 3 rounds, ritmo acelerado do início ao fim.",
    exercises: [
      { name: "Burpee com flexão", type: "CARDIO", sets: rounds(10) },
      { name: "Mountain climber cruzado", type: "CARDIO", sets: rounds(30) },
      { name: "Agachamento com chute frontal", type: "STRENGTH", sets: rounds(16) },
      { name: "Prancha com elevação de perna", type: "STRENGTH", sets: rounds(16) },
      { name: "Polichinelo com agachamento", type: "CARDIO", sets: rounds(30) },
      { name: "Corrida parada rápida", type: "CARDIO", sets: rounds(45) },
    ],
  },
  {
    id: "hiit-q48-d",
    track: "classic",
    name: "Circuito Trovão",
    className: "HIIT Q48 • Dia D",
    difficulty: "B",
    description:
      "Circuito de alta intensidade, 3 rounds, fechamento de semana com volume total alto.",
    exercises: [
      { name: "Flexão com rotação", type: "STRENGTH", sets: rounds(12) },
      { name: "Afundo reverso com salto", type: "STRENGTH", sets: rounds(16) },
      { name: "Abdominal canivete", type: "STRENGTH", sets: rounds(15) },
      { name: "Prancha dinâmica", type: "STRENGTH", sets: rounds(20) },
      { name: "Burpee sem flexão", type: "CARDIO", sets: rounds(15) },
      { name: "Corrida parada com joelho alto", type: "CARDIO", sets: rounds(40) },
    ],
  },
];

// ---------------------------------------------------------------------------
// Low-impact track: no jumps, standing / wall-supported / seated moves only.
// Each exercise: kind and a rough rep count for 30s of work (used when the
// circuit is logged as a workout).
// ---------------------------------------------------------------------------
const LOW_IMPACT_EXERCISES: Record<string, { type: "STRENGTH" | "CARDIO"; reps: number }> = {
  "Agachamento com apoio": { type: "STRENGTH", reps: 10 },
  "Agachamento com alcance": { type: "STRENGTH", reps: 10 },
  "Flexão na parede": { type: "STRENGTH", reps: 12 },
  "Flexão inclinada": { type: "STRENGTH", reps: 8 },
  "Rosca de perna em pé": { type: "STRENGTH", reps: 20 },
  "Abdução lateral de quadril": { type: "STRENGTH", reps: 16 },
  "Panturrilha em pé": { type: "STRENGTH", reps: 20 },
  "Ponte de glúteo": { type: "STRENGTH", reps: 12 },
  "Elevação de pernas sentado": { type: "STRENGTH", reps: 10 },
  "Inclinação pélvica em pé": { type: "STRENGTH", reps: 12 },
  "Arqueiro em pé": { type: "CARDIO", reps: 14 },
  "Marcha acelerada": { type: "CARDIO", reps: 40 },
};

export const TIMED_SETTINGS = {
  workSeconds: 30,
  transitionSeconds: 10,
  pauseSeconds: 60,
  pauseExercise: "Marcha estática",
};

function lowImpact(
  id: string,
  name: string,
  difficulty: Program["difficulty"],
  focus: string,
  blocks: string[][],
): Program {
  const counts = new Map<string, number>();
  for (const block of blocks) {
    for (const exName of block) counts.set(exName, (counts.get(exName) ?? 0) + 1);
  }
  return {
    id,
    track: "low-impact",
    name,
    className: "BAIXO IMPACTO • 10 MIN",
    difficulty,
    description: `${focus} 3 blocos de 4 exercícios (${TIMED_SETTINGS.workSeconds}s de esforço, ${TIMED_SETTINGS.transitionSeconds}s de troca) com 2 pausas ativas de 1 min em marcha estática. Sem saltos.`,
    timed: { ...TIMED_SETTINGS, blocks },
    exercises: [...counts.entries()].map(([exName, times]) => ({
      name: exName,
      type: LOW_IMPACT_EXERCISES[exName].type,
      sets: Array.from({ length: times }, () => ({
        reps: LOW_IMPACT_EXERCISES[exName].reps,
        weightKg: null,
      })),
    })),
  };
}

const LOW_IMPACT_PROGRAMS: Program[] = [
  lowImpact("low-a", "Despertar", "E", "Corpo inteiro, ritmo leve para retomar a rotina.", [
    ["Agachamento com apoio", "Flexão na parede", "Marcha acelerada", "Panturrilha em pé"],
    ["Abdução lateral de quadril", "Arqueiro em pé", "Elevação de pernas sentado", "Rosca de perna em pé"],
    ["Agachamento com apoio", "Flexão na parede", "Marcha acelerada", "Panturrilha em pé"],
  ]),
  lowImpact("low-b", "Pernas Seguras", "E", "Pernas e glúteos protegendo joelhos e tornozelos.", [
    ["Agachamento com apoio", "Abdução lateral de quadril", "Panturrilha em pé", "Rosca de perna em pé"],
    ["Agachamento com alcance", "Ponte de glúteo", "Marcha acelerada", "Abdução lateral de quadril"],
    ["Agachamento com apoio", "Rosca de perna em pé", "Panturrilha em pé", "Ponte de glúteo"],
  ]),
  lowImpact("low-c", "Tronco e Postura", "D", "Peito, costas e core, tudo em pé ou sentado.", [
    ["Flexão na parede", "Arqueiro em pé", "Inclinação pélvica em pé", "Elevação de pernas sentado"],
    ["Flexão inclinada", "Marcha acelerada", "Abdução lateral de quadril", "Elevação de pernas sentado"],
    ["Flexão na parede", "Arqueiro em pé", "Inclinação pélvica em pé", "Marcha acelerada"],
  ]),
  lowImpact("low-d", "Cardio Suave", "D", "Foco em fôlego e coordenação, sempre com um pé no chão.", [
    ["Marcha acelerada", "Arqueiro em pé", "Rosca de perna em pé", "Agachamento com alcance"],
    ["Marcha acelerada", "Abdução lateral de quadril", "Panturrilha em pé", "Flexão na parede"],
    ["Marcha acelerada", "Arqueiro em pé", "Agachamento com apoio", "Rosca de perna em pé"],
  ]),
];

export const PROGRAMS: Program[] = [...LOW_IMPACT_PROGRAMS, ...CLASSIC_PROGRAMS];
