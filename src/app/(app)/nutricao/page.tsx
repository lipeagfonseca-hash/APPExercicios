import { sessaoDoServidor } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { calculateCalorieGoal, calculateMacros } from "@/lib/nutrition";
import NutritionForm from "@/components/NutritionForm";
import WeightGoalChart from "@/components/WeightGoalChart";

export default async function NutritionPage() {
  const session = await sessaoDoServidor();
  const userId = session!.user.id;

  const profile = await prisma.nutritionProfile.findUnique({
    where: { userId },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Plano de Nutrição
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-3">
          <NutritionForm
            initial={
              profile
                ? {
                    weightKg: profile.weightKg,
                    targetWeightKg: profile.targetWeightKg,
                    heightCm: profile.heightCm,
                    age: profile.age,
                    gender: profile.gender,
                    activityLevel: profile.activityLevel,
                    goal: profile.goal,
                  }
                : undefined
            }
          />
        </div>

        <div className="lg:col-span-2">
          {profile ? (
            <NutritionSummary
              weightKg={profile.weightKg}
              targetWeightKg={profile.targetWeightKg}
              heightCm={profile.heightCm}
              age={profile.age}
              gender={profile.gender}
              activityLevel={profile.activityLevel}
              goal={profile.goal}
            />
          ) : (
            <p className="font-body text-body-sm text-on-surface-variant">
              Preencha seus dados pra calcular sua meta calórica e macros.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NutritionSummary({
  weightKg,
  targetWeightKg,
  heightCm,
  age,
  gender,
  activityLevel,
  goal,
}: {
  weightKg: number;
  targetWeightKg: number;
  heightCm: number;
  age: number;
  gender: "MALE" | "FEMALE";
  activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
  goal: "LOSE" | "MAINTAIN" | "GAIN";
}) {
  const calories = calculateCalorieGoal(
    weightKg,
    heightCm,
    age,
    gender,
    activityLevel,
    goal,
  );
  const macros = calculateMacros(calories, weightKg);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4 text-center">
        <p className="font-mono-label text-label-sm uppercase tracking-[0.3em] text-primary">
          Sua meta calórica
        </p>
        <p className="font-display text-headline-xl text-on-surface">
          {calories} kcal
        </p>
        <p className="font-mono-label text-label-sm text-on-surface-variant">
          por dia
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MacroCard label="Proteína" value={macros.proteinG} />
        <MacroCard label="Carboidrato" value={macros.carbsG} />
        <MacroCard label="Gordura" value={macros.fatG} />
      </div>

      <WeightGoalChart current={weightKg} target={targetWeightKg} />
    </div>
  );
}

function MacroCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-3 text-center">
      <p className="font-mono-label text-label-sm text-on-surface-variant">
        {label}
      </p>
      <p className="font-display text-headline-md text-on-surface">{value}g</p>
      <p className="font-mono-label text-label-sm text-on-surface-variant">
        por dia
      </p>
    </div>
  );
}
