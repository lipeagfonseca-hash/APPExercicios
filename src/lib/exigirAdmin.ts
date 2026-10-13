import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

/**
 * Para rotas de API do admin: devolve o usuário da sessão se for admin, senão null.
 * A checagem é feita no servidor a cada chamada (esconder o botão na tela não protege nada).
 */
export async function exigirAdmin() {
  const session = await auth();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) return null;
  return { id: session.user.id, email: session.user.email as string };
}
