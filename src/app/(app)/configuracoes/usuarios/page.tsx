import { prisma } from "@/lib/prisma";
import UserCreateForm from "@/components/UserCreateForm";

export default async function UsersSettingsPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
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
            <li
              key={u.id}
              className="flex flex-col rounded-lg border border-primary-container/10 bg-surface-container-lowest/60 px-4 py-2"
            >
              <span className="font-body text-body-md text-on-surface">{u.name}</span>
              <span className="font-mono-label text-label-sm text-on-surface-variant">
                {u.email}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
