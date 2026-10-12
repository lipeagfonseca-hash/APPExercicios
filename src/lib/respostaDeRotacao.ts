import { NextResponse } from "next/server";
import { ErroDeRotacao, type CodigoDeErro } from "@/lib/rotacaoServico";

const STATUS_POR_CODIGO: Record<CodigoDeErro, number> = {
  SEM_TREINO_HOJE: 409,
  JA_CONCLUIDO: 409,
  NAO_INICIADO: 409,
  TEMPO_INSUFICIENTE: 422,
};

/** Converte um erro de regra de negócio em resposta HTTP; erros inesperados viram 500 genérico. */
export function respostaDeErro(erro: unknown) {
  if (erro instanceof ErroDeRotacao) {
    return NextResponse.json(
      { error: erro.message, codigo: erro.codigo },
      { status: STATUS_POR_CODIGO[erro.codigo] },
    );
  }
  console.error("Erro inesperado na rotação de treinos", erro);
  return NextResponse.json({ error: "Erro interno." }, { status: 500 });
}
