"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AUTH_WINDOW_STYLE, AuthBackdrop, AuthLogo } from "@/components/AuthBrand";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-16">
      <AuthBackdrop />
      <div
        className="rounded-xl border border-primary-container/20 p-6"
        style={AUTH_WINDOW_STYLE}
      >
      <AuthLogo />
      <h1 className="mb-6 font-display text-headline-lg uppercase text-on-surface">
        Criar conta
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="name"
            className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant"
          >
            Nome
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="email"
            className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="password"
            className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant"
          >
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 text-on-surface"
          />
        </div>
        {error && (
          <p className="font-mono-label text-label-sm text-error">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-container px-4 py-2.5 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)] disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="mt-4 font-body text-body-sm text-on-surface-variant">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
      </div>
    </div>
  );
}
