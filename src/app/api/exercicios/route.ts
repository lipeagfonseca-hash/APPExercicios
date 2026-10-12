import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import {
  exerciseType,
  normalizeSearch,
  type ExerciseSummary,
} from "@/lib/exerciseCatalog";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const limit = await rateLimit(`exercises:${session.user.id}`, 90, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas buscas. Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const params = new URL(request.url).searchParams;
  const q = normalizeSearch((params.get("q") ?? "").slice(0, 60));
  const terms = q.split(" ").filter(Boolean).slice(0, 5);
  const take = Math.min(Math.max(Number(params.get("limit")) || 20, 1), 40);

  const rows = await prisma.exercise.findMany({
    where: { AND: terms.map((t) => ({ search: { contains: t } })) },
    select: {
      id: true,
      namePt: true,
      nameEn: true,
      bodyPart: true,
      equipment: true,
      target: true,
    },
    orderBy: { namePt: "asc" },
    take: 80,
  });

  const rank = (name: string) => {
    const n = normalizeSearch(name);
    return n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : 3;
  };

  const items: ExerciseSummary[] = rows
    .sort((a, b) => rank(a.namePt) - rank(b.namePt))
    .slice(0, take)
    .map((r) => ({
      id: r.id,
      name: r.namePt,
      nameEn: r.nameEn,
      bodyPart: r.bodyPart,
      equipment: r.equipment,
      target: r.target,
      type: exerciseType(r.namePt, r.bodyPart),
    }));

  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
