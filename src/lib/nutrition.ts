export type Gender = "MALE" | "FEMALE";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type Goal = "LOSE" | "MAINTAIN" | "GAIN";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  LOSE: -500,
  MAINTAIN: 0,
  GAIN: 300,
};

export function calculateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "MALE" ? base + 5 : base - 161;
}

export function calculateCalorieGoal(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal,
): number {
  const bmr = calculateBmr(weightKg, heightCm, age, gender);
  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];
  return Math.round(tdee + GOAL_ADJUSTMENT[goal]);
}

export type Macros = { proteinG: number; carbsG: number; fatG: number };

export function calculateMacros(calories: number, weightKg: number): Macros {
  const proteinG = Math.round(weightKg * 2);
  const proteinKcal = proteinG * 4;
  const fatKcal = calories * 0.25;
  const fatG = Math.round(fatKcal / 9);
  const carbsKcal = Math.max(0, calories - proteinKcal - fatKcal);
  const carbsG = Math.round(carbsKcal / 4);
  return { proteinG, carbsG, fatG };
}
