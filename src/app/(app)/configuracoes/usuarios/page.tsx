import { prisma } from "@/lib/prisma";
import { sessaoDeAdmin } from "@/lib/sessao";
import UserCreateForm from "@/components/UserCreateForm";
import UserRow from "@/components/UserRow";
import { isAdminEmail } from "@/lib/admin";
import { EMAIL_DO_USUARIO_AQUECEDOR } from "@/config/aquecimento";

export default async function UsersSettingsPage() {
  await sessaoDeAdmin();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true, desativadoEm: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex max-w-md flex-col gap-4 rounded-lg border border-primary-container/20 bg-surface-container-lowest/80 p-4">
        <h2 className="font-mono-label text-label-md uppercase tracking-wider text-on-surface">
          Criar usuário
        </h2>
        <p className="font-body text-body-sm text-on-surface-variant">
          O cadastro público foi desativado: só o administrador cria contas.
        </p>
        <UserCreateForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono-label text-label-md uppercase tracking-wider text-on-surface">
          Usuários cadastrados ({users.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <UserRow
              key={u.id}
              id={u.id}
              name={u.name}
              email={u.email}
              desativado={u.desativadoEm !== null}
              interno={u.email === EMAIL_DO_USUARIO_AQUECEDOR}
              admin={isAdminEmail(u.email)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
