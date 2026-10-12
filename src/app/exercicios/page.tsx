import { prisma } from "@/lib/prisma";
import ExerciseGallery from "@/components/ExerciseGallery";

export default async function ExercisesPage() {
  const rows = await prisma.exercise.findMany({
    select: {
      id: true,
      namePt: true,
      nameEn: true,
      bodyPart: true,
      equipment: true,
      target: true,
    },
    orderBy: { namePt: "asc" },
  });

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Exercícios
      </h1>
      <p className="max-w-2xl font-body text-body-md text-on-surface-variant">
        Catálogo com demonstração de cada movimento. Toque em um exercício para
        ver o GIF e as instruções.
      </p>
      <ExerciseGallery
        exercises={rows.map((r) => ({
          id: r.id,
          name: r.namePt,
          nameEn: r.nameEn,
          bodyPart: r.bodyPart,
          equipment: r.equipment,
          target: r.target,
        }))}
      />
    </div>
  );
}
