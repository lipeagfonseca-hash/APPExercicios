import Link from "next/link";

// Página estática (vem do CDN). Quem já está logado é redirecionado para /dashboard pelo proxy.ts.
export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <span className="font-mono-label text-label-sm uppercase tracking-[0.3em] text-primary">
        [OVERLAY DIRECTIVE // ACESSO AO SISTEMA]
      </span>
      <h1 className="font-display text-headline-xl uppercase text-on-surface drop-shadow-[0_0_20px_rgba(0,210,255,0.4)]">
        Sistema
      </h1>
      <p className="font-body text-body-lg text-on-surface-variant max-w-md">
        Registre seus treinos, cumpra a Missão Diária e suba de nível rumo ao
        Rank S. A falha não é uma alternativa aceitável.
      </p>
      <div className="flex gap-4">
        <Link
          href="/register"
          className="rounded-lg bg-primary-container px-6 py-3 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_25px_rgba(0,210,255,0.6)]"
        >
          Despertar
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-primary-container/40 px-6 py-3 font-mono-label text-label-md uppercase tracking-wider text-primary hover:bg-primary-container/10"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
