import { NextResponse } from "next/server";
import { catalogoExerciciosPorId } from "@/lib/catalogoExercicios";

// Dado público e imutável entre deploys: gerado ESTÁTICO no build (um arquivo por
// exercício, servido pelo CDN), sem função, sem banco e sem login.
// O Cache-Control longo desta rota é definido em next.config.ts.
export const dynamic = "force-static";

export function generateStaticParams() {
  return [...catalogoExerciciosPorId.keys()].map((id) => ({ id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = catalogoExerciciosPorId.get(id);
  if (!e) return NextResponse.json({ error: "Exercício não encontrado." }, { status: 404 });

  return NextResponse.json({
    exercise: {
      id: e.id,
      namePt: e.nome,
      nameEn: e.nomeEn,
      bodyPart: e.regiao,
      equipment: e.equipamento,
      target: e.alvo,
      secondary: e.secundarios,
      instructionsEn: e.instrucoesEn,
      instructionsEs: e.instrucoesEs,
    },
  });
}
