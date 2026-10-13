import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

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

/**
 * Para páginas de administração. Cada página admin precisa chamar isto ANTES de consultar
 * qualquer dado: o redirecionamento do layout não basta, porque o Next renderiza o layout e a
 * página ao mesmo tempo e a página chegaria a ser enviada a quem não é admin.
 */
export async function sessaoDeAdmin() {
  const session = await sessaoObrigatoria();
  if (!isAdminEmail(session.user.email)) redirect("/dashboard");
  return session;
}
