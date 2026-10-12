import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d{4}$/.test(id)) {
    return NextResponse.json({ error: "Exercício não encontrado." }, { status: 404 });
  }

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      namePt: true,
      nameEn: true,
      bodyPart: true,
      equipment: true,
      target: true,
      secondary: true,
      instructionsEn: true,
      instructionsEs: true,
    },
  });
  if (!exercise) {
    return NextResponse.json({ error: "Exercício não encontrado." }, { status: 404 });
  }

  return NextResponse.json(
    { exercise },
    { headers: { "Cache-Control": "private, max-age=86400" } },
  );
}
