"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial?: {
    weightKg: number;
    targetWeightKg: number;
    heightCm: number;
    age: number;
    gender: "MALE" | "FEMALE";
    activityLevel: "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
    goal: "LOSE" | "MAINTAIN" | "GAIN";
  };
};

export default function NutritionForm({ initial }: Props) {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState(String(initial?.weightKg ?? ""));
  const [targetWeightKg, setTargetWeightKg] = useState(
    String(initial?.targetWeightKg ?? ""),
  );
  const [heightCm, setHeightCm] = useState(String(initial?.heightCm ?? ""));
  const [age, setAge] = useState(String(initial?.age ?? ""));
  const [gender, setGender] = useState(initial?.gender ?? "MALE");
  const [activityLevel, setActivityLevel] = useState(
    initial?.activityLevel ?? "MODERATE",
  );
  const [goal, setGoal] = useState(initial?.goal ?? "MAINTAIN");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weightKg: Number(weightKg),
        targetWeightKg: Number(targetWeightKg),
        heightCm: Number(heightCm),
        age: Number(age),
        gender,
        activityLevel,
        goal,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Erro ao salvar. Confira os valores.");
      return;
    }

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4"
    >
      <h2 className="font-display text-headline-sm uppercase tracking-wider text-primary">
        {initial ? "Atualizar dados" : "Configure seu plano"}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso atual (kg)">
          <input
            type="number"
            step="0.1"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </Field>
        <Field label="Peso meta (kg)">
          <input
            type="number"
            step="0.1"
            required
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(e.target.value)}
            className="w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </Field>
        <Field label="Altura (cm)">
          <input
            type="number"
            required
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </Field>
        <Field label="Idade">
          <input
            type="number"
            required
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </Field>
        <Field label="Gênero">
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as typeof gender)}
            className="w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          >
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Feminino</option>
          </select>
        </Field>
        <Field label="Nível de atividade">
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value as typeof activityLevel)}
            className="w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          >
            <option value="SEDENTARY">Sedentário</option>
            <option value="LIGHT">Leve (1-3x/semana)</option>
            <option value="MODERATE">Moderado (3-5x/semana)</option>
            <option value="ACTIVE">Ativo (6-7x/semana)</option>
            <option value="VERY_ACTIVE">Muito ativo (atleta)</option>
          </select>
        </Field>
        <Field label="Objetivo">
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as typeof goal)}
            className="col-span-2 w-full rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          >
            <option value="LOSE">Perder peso</option>
            <option value="MAINTAIN">Manter peso</option>
            <option value="GAIN">Ganhar peso</option>
          </select>
        </Field>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-lg bg-primary-container px-4 py-2.5 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
      {label}
      {children}
    </label>
  );
}
