import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { exigirAdmin } from "@/lib/exigirAdmin";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { senhaSchema, MENSAGEM_SENHA_INVALIDA } from "@/lib/senhaForte";
import { EMAIL_DO_USUARIO_AQUECEDOR } from "@/config/aquecimento";

const schema = z.object({ senha: senhaSchema });

// Troca a senha de uma conta. A senha nova é definida pelo admin (e entregue à pessoa fora do
// sistema). As sessões já abertas continuam até expirar ou até a conta ser desativada.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const limite = await rateLimit(`admin:usuario-senha:${admin.id}`, 20, 60 * 60_000);
  if (!limite.ok) {
    return NextResponse.json({ error: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: MENSAGEM_SENHA_INVALIDA }, { status: 400 });

  const { id } = await params;
  const alvo = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!alvo) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  if (alvo.email === EMAIL_DO_USUARIO_AQUECEDOR) {
    return NextResponse.json({ error: "Este usuário é interno do sistema." }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { password: await bcrypt.hash(parsed.data.senha, 12) } });
  return NextResponse.json({ ok: true });
}
