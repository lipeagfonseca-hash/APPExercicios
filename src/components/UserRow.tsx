"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  name: string;
  email: string;
  desativado: boolean;
  /** Usuário interno do sistema (aquecedor): só aparece na lista, sem ações. */
  interno: boolean;
  /** Administradores não podem ser desativados. */
  admin: boolean;
};

const botao =
  "rounded-lg border border-primary-container/30 px-3 py-1.5 font-mono-label text-label-sm uppercase tracking-wider text-primary hover:bg-primary-container/10 disabled:opacity-50";

export default function UserRow({ id, name, email, desativado, interno, admin }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [trocando, setTrocando] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function chamar(url: string, method: string, body: unknown, sucesso: string) {
    setErro(null);
    setOk(null);
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível concluir.");
        return false;
      }
      setOk(sucesso);
      router.refresh();
      return true;
    } catch {
      setErro("Falha de conexão. Tente de novo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function salvarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (await chamar(`/api/admin/usuarios/${id}/senha`, "PUT", { senha }, "Senha alterada.")) {
      setSenha("");
      setTrocando(false);
    }
  }

  function alternar() {
    if (!desativado && !window.confirm(`Desativar ${name}? A pessoa perde o acesso em poucos minutos. Nada é apagado.`)) return;
    void chamar(`/api/admin/usuarios/${id}`, "PATCH", { ativo: desativado }, desativado ? "Conta reativada." : "Conta desativada.");
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-primary-container/10 bg-surface-container-lowest/60 px-4 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className={`font-body text-body-md ${desativado ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
            {name}
            {desativado && <span className="ml-2 font-mono-label text-label-sm text-error no-underline">DESATIVADO</span>}
          </span>
          <span className="font-mono-label text-label-sm text-on-surface-variant">{email}</span>
        </div>
        {!interno && (
          <div className="flex gap-2">
            <button type="button" className={botao} disabled={busy} onClick={() => setTrocando((v) => !v)}>
              Trocar senha
            </button>
            {!admin && (
              <button type="button" className={botao} disabled={busy} onClick={alternar}>
                {desativado ? "Reativar" : "Desativar"}
              </button>
            )}
          </div>
        )}
      </div>
      {trocando && (
        <form onSubmit={salvarSenha} className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor={`senha-${id}`} className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
              Nova senha
            </label>
            <input
              id={`senha-${id}`}
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={busy}
              className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface disabled:opacity-50"
            />
          </div>
          <button type="submit" className={botao} disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </button>
          <span className="w-full font-mono-label text-label-sm text-on-surface-variant">
            8 a 72 caracteres, com letra e número. Entregue a senha à pessoa fora do sistema.
          </span>
        </form>
      )}
      {erro && <p role="alert" className="font-mono-label text-label-sm text-error">{erro}</p>}
      {ok && <p role="status" className="font-mono-label text-label-sm text-primary">{ok}</p>}
    </li>
  );
}
