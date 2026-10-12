import { resumoDoCatalogo } from "@/lib/catalogoExercicios";
import ExerciseGallery from "@/components/ExerciseGallery";

// O catálogo é estático: nenhuma consulta ao banco para montar esta página.
export default function ExercisesPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Exercícios
      </h1>
      <p className="max-w-2xl font-body text-body-md text-on-surface-variant">
        Catálogo com demonstração de cada movimento. Toque em um exercício para
        ver o GIF e as instruções.
      </p>
      <ExerciseGallery exercises={resumoDoCatalogo} />
    </div>
  );
}
