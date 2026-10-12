import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { registrarInicioDoTreino } from "@/lib/rotacaoServico";
import { respostaDeErro } from "@/lib/respostaDeRotacao";

// Chamada quando o usuário aperta INICIAR TREINO. Só registra o horário de início;
// o treino a executar é decidido pelo servidor (o cliente não escolhe nada).
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const limite = await rateLimit(`treino-iniciar:${session.user.id}`, 20, 60_000);
  if (!limite.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um instante." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfter) } },
    );
  }

  try {
    return NextResponse.json(await registrarInicioDoTreino(session.user.id));
  } catch (erro) {
    return respostaDeErro(erro);
  }
}
