"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const fieldClass =
  "rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface disabled:opacity-50";
const labelClass = "font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant";

const VAZIO = { nome: "", sobrenome: "", email: "", senha: "" };

export default function UserCreateForm() {
  const router = useRouter();
  const [campos, setCampos] = useState(VAZIO);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const set = (campo: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampos((c) => ({ ...c, [campo]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível criar o usuário.");
        return;
      }
      setOk(`Usuário ${campos.nome} ${campos.sobrenome} criado.`);
      setCampos(VAZIO);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="novo-nome" className={labelClass}>Nome</label>
          <input id="novo-nome" required maxLength={60} autoComplete="off" value={campos.nome} onChange={set("nome")} className={fieldClass} disabled={busy} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="novo-sobrenome" className={labelClass}>Sobrenome</label>
          <input id="novo-sobrenome" required maxLength={60} autoComplete="off" value={campos.sobrenome} onChange={set("sobrenome")} className={fieldClass} disabled={busy} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="novo-email" className={labelClass}>Email</label>
        <input id="novo-email" type="email" required maxLength={254} autoComplete="off" value={campos.email} onChange={set("email")} className={fieldClass} disabled={busy} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="novo-senha" className={labelClass}>Senha</label>
        <input id="novo-senha" type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={campos.senha} onChange={set("senha")} className={fieldClass} disabled={busy} />
        <span className="font-mono-label text-label-sm text-on-surface-variant">
          8 a 72 caracteres, com letra e número.
        </span>
      </div>
      {erro && <p role="alert" className="font-mono-label text-label-sm text-error">{erro}</p>}
      {ok && <p role="status" className="font-mono-label text-label-sm text-primary">{ok}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-primary-container px-4 py-2.5 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container disabled:opacity-50"
      >
        {busy ? "Criando..." : "Criar usuário"}
      </button>
    </form>
  );
}
