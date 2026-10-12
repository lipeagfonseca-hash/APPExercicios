import { prisma } from "@/lib/prisma";

export default async function UsersSettingsPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const fieldClass =
    "rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface disabled:opacity-50";
  const labelClass =
    "font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex max-w-md flex-col gap-4 rounded-lg border border-primary-container/20 bg-surface-container-lowest/80 p-4">
        <h2 className="font-mono-label text-label-md uppercase tracking-wider text-on-surface">
          Criar usuário
        </h2>
        {/* Esqueleto: o formulário ainda não está ligado a nenhuma API. */}
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nome</label>
            <input disabled className={fieldClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Email</label>
            <input type="email" disabled className={fieldClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Senha</label>
            <input type="password" disabled className={fieldClass} />
          </div>
          <button
            type="button"
            disabled
            className="rounded-lg bg-primary-container px-4 py-2.5 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container disabled:opacity-50"
          >
            Criar usuário
          </button>
          <p className="font-mono-label text-label-sm text-on-surface-variant">
            EM BREVE
          </p>
        </form>
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
