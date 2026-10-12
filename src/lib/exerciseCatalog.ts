export type ExerciseSummary = {
  id: string;
  name: string;
  nameEn: string;
  bodyPart: string;
  equipment: string;
  target: string;
  type: "STRENGTH" | "CARDIO";
};

const CARDIO_HINT = /corrida|salto|burpee|mountain|polichinelo|skater|joelho alto|caminhada|passo|tiros/i;

export function exerciseType(name: string, bodyPart: string): "STRENGTH" | "CARDIO" {
  return bodyPart === "Cardio" || CARDIO_HINT.test(name) ? "CARDIO" : "STRENGTH";
}

export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export const exerciseThumbUrl = (id: string) => `/exercises/thumb/${id}.jpg`;
export const exerciseGifUrl = (id: string) => `/exercises/gif/${id}.gif`;
