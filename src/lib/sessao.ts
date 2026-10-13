import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Sessão para uso em componentes de servidor (páginas e layouts).
 *
 * O Auth.js gera um token aleatório (CSRF) dentro de `auth()`. Com Cache Components o Next
 * acusa isso como "valor instável durante a pré-renderização" se `auth()` rodar antes de o
 * pedido ser conhecido. `connection()` marca o ponto como dinâmico, então o erro some e o
 * casco estático continua sendo servido pelo CDN. Em rotas de API use `auth()` direto.
 */
export async function sessaoDoServidor() {
  await connection();
  return auth();
}

/**
 * Para páginas que só existem para quem está logado. Se a sessão caiu (conta desativada ou
 * apagada, ou cookie antigo), manda para o login em vez de quebrar a página.
 */
export async function sessaoObrigatoria() {
  const session = await sessaoDoServidor();
  if (!session?.user) redirect("/login");
  return session;
}
