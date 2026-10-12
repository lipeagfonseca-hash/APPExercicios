// ============================================================================
// AQUECEDOR (chamado pelo agendamento do QStash; veja src/config/aquecimento.ts)
// ----------------------------------------------------------------------------
// Acorda o banco (Neon) e renderiza as páginas principais para que a função de
// cada rota esteja "quente" quando o usuário abrir o app. Só age DENTRO das
// janelas de horário; fora delas responde na hora sem gastar nada.
//
// Proteção: exige "Authorization: Bearer <AQUECIMENTO_SEGREDO>". Sem o segredo
// correto nada é consultado. As páginas são abertas com uma sessão EFÊMERA do
// usuário interno "aquecedor" (gerada aqui, nunca guardada em lugar nenhum).
// ============================================================================

import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { dentroDaJanelaDeAquecimento, segredosIguais, tokenDoBearer } from "@/lib/aquecimento";
import {
  EMAIL_DO_USUARIO_AQUECEDOR,
  JANELAS_DE_AQUECIMENTO,
  PAGINAS_PARA_AQUECER,
} from "@/config/aquecimento";

export const dynamic = "force-dynamic";

// Em produção (https) o Auth.js usa este nome de cookie; ele também é o "salt" do JWT.
const COOKIE_DE_SESSAO = "__Secure-authjs.session-token";

export async function GET(request: Request) {
  // Tentativas inválidas ficam limitadas por IP (barato e antes de qualquer consulta).
  const limite = await rateLimit(`aquecer:${clientIp(request.headers)}`, 30, 60_000);
  if (!limite.ok) return NextResponse.json({ error: "Muitas tentativas." }, { status: 429 });

  const segredo = process.env.AQUECIMENTO_SEGREDO;
  const recebido = tokenDoBearer(request.headers.get("authorization"));
  if (!segredo || !segredosIguais(recebido, segredo)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Chave liga/desliga e janela de horário: o cron pode estar errado, o endpoint não.
  if (process.env.AQUECIMENTO_ATIVO === "false") {
    return NextResponse.json({ ok: true, aquecido: false, motivo: "desativado" });
  }
  if (!dentroDaJanelaDeAquecimento(JANELAS_DE_AQUECIMENTO)) {
    return NextResponse.json({ ok: true, aquecido: false, motivo: "fora da janela" });
  }

  const inicio = performance.now();
  const resultado: Record<string, unknown> = { ok: true, aquecido: true };

  // 1) Acorda o banco e a conexão.
  const aquecedor = await prisma.user.findUnique({
    where: { email: EMAIL_DO_USUARIO_AQUECEDOR },
    select: { id: true, name: true, email: true },
  });
  resultado.bancoMs = Math.round(performance.now() - inicio);

  // 2) Abre as páginas principais (cada rota é uma função separada na Vercel).
  const authSecret = process.env.AUTH_SECRET;
  if (aquecedor && authSecret) {
    const jwt = await encode({
      token: { id: aquecedor.id, name: aquecedor.name, email: aquecedor.email, sub: aquecedor.id },
      secret: authSecret,
      salt: COOKIE_DE_SESSAO,
      maxAge: 5 * 60, // vale só alguns minutos
    });
    const origem = new URL(request.url).origin;

    const paginas = await Promise.allSettled(
      PAGINAS_PARA_AQUECER.map(async (caminho) => {
        const t0 = performance.now();
        const resposta = await fetch(origem + caminho, {
          headers: { cookie: `${COOKIE_DE_SESSAO}=${jwt}` },
          redirect: "manual",
          cache: "no-store",
          signal: AbortSignal.timeout(25_000),
        });
        await resposta.arrayBuffer(); // consome o corpo: a página precisa terminar de renderizar
        return [caminho, `${resposta.status} em ${Math.round(performance.now() - t0)} ms`] as const;
      }),
    );
    resultado.paginas = Object.fromEntries(
      paginas.map((p, i) => (p.status === "fulfilled" ? p.value : [PAGINAS_PARA_AQUECER[i], "falhou"])),
    );
  } else {
    resultado.paginas = "usuário aquecedor ou AUTH_SECRET ausente: só o banco foi acordado";
  }

  resultado.totalMs = Math.round(performance.now() - inicio);
  return NextResponse.json(resultado, { headers: { "Cache-Control": "no-store" } });
}
