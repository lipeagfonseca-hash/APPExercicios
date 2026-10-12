import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { concluirTreinoDoDia } from "@/lib/rotacaoServico";
import { respostaDeErro } from "@/lib/respostaDeRotacao";

// Conclui o treino do dia e concede o XP. Todas as regras (treino pendente, tempo
// mínimo, uma única vez por dia) são validadas no servidor, dentro de uma transação.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const limite = await rateLimit(`treino-concluir:${session.user.id}`, 10, 60_000);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfter) } },
    );
  }

  try {
    return NextResponse.json(await concluirTreinoDoDia(session.user.id));
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
