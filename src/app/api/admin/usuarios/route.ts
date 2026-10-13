import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { exigirAdmin } from "@/lib/exigirAdmin";
import { senhaSchema } from "@/lib/senhaForte";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

// Única forma de criar uma conta: o cadastro público foi removido. A checagem de admin é
// feita aqui, no servidor, a cada chamada (a interface escondida não protege nada).
const criarSchema = z.object({
  nome: z.string().trim().min(1).max(60),
  sobrenome: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  senha: senhaSchema,
});

export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const limite = await rateLimit(`admin:criar-usuario:${admin.id}`, 30, 60 * 60_000);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfter) } },
    );
  }

  const parsed = criarSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const motivo = parsed.error.issues.find((i) => i.path[0] === "senha" && i.message.startsWith("A senha"))?.message;
    return NextResponse.json(
      {
        error:
          motivo ??
          "Dados inválidos. Informe nome, sobrenome, email válido e senha de 8 a 72 caracteres.",
      },
      { status: 400 },
    );
  }

  const { nome, sobrenome, email, senha } = parsed.data;

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "Já existe uma conta com esse email." }, { status: 409 });
  }

  const hash = await bcrypt.hash(senha, 12);
  try {
    // O perfil de jogador é criado no primeiro acesso da pessoa (carregarVisaoDoDia).
    await prisma.user.create({ data: { name: `${nome} ${sobrenome}`, email, password: hash } });
  } catch (e) {
    // Corrida entre duas criações com o mesmo email: a restrição UNIQUE do banco decide.
    if (typeof e === "object" && e && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "Já existe uma conta com esse email." }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
