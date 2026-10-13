import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/exigirAdmin";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { EMAIL_DO_USUARIO_AQUECEDOR } from "@/config/aquecimento";

const schema = z.object({ ativo: z.boolean() });

// Desativar / reativar uma conta. Desativar não apaga nada (histórico, XP e treinos ficam):
// a pessoa não consegue entrar e a sessão aberta cai em até ~5 minutos.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const limite = await rateLimit(`admin:usuario-estado:${admin.id}`, 60, 60 * 60_000);
  if (!limite.ok) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { id } = await params;
  const alvo = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!alvo) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  // Proteções contra se trancar para fora ou quebrar o aquecimento.
  if (alvo.email === EMAIL_DO_USUARIO_AQUECEDOR) {
    return NextResponse.json({ error: "Este usuário é interno do sistema." }, { status: 400 });
  }
  if (!parsed.data.ativo && (alvo.id === admin.id || isAdminEmail(alvo.email))) {
    return NextResponse.json({ error: "Não é possível desativar um administrador." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { desativadoEm: parsed.data.ativo ? null : new Date() },
  });
  return NextResponse.json({ ok: true });
}
