"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { rankFromLevel, xpForLevel } from "@/lib/leveling";

const NAV_ITEMS = [
  { href: "/dashboard", label: "MISSÃO DIÁRIA", icon: "assignment_late" },
  { href: "/rank", label: "RANK", icon: "monitoring" },
  { href: "/programas", label: "PROGRAMAS", icon: "swords" },
  { href: "/exercicios", label: "EXERCÍCIOS", icon: "sports_gymnastics" },
  { href: "/calendario", label: "CALENDÁRIO", icon: "calendar_month" },
  { href: "/historico", label: "HISTÓRICO", icon: "history" },
  { href: "/nutricao", label: "NUTRIÇÃO", icon: "nutrition" },
  { href: "/conquistas", label: "CONQUISTAS", icon: "inventory_2" },
];

type Props = {
  name: string;
  level: number;
  xp: number;
  isPenalty: boolean;
  isAdmin?: boolean;
};

const ADMIN_ITEM = { href: "/configuracoes", label: "CONFIGURAÇÕES", icon: "settings" };

export default function Sidebar({ name, level, xp, isPenalty, isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // Destaque OTIMISTA: o item clicado fica ativo na hora, antes de a página chegar.
  // Guardamos de qual rota o clique partiu; quando a rota muda, o alvo deixa de valer.
  const [alvo, setAlvo] = useState<{ href: string; de: string } | null>(null);
  const hrefAtivo = alvo && alvo.de === pathname ? alvo.href : pathname;

  // Prefetch só quando o usuário demonstra intenção (mouse, foco ou toque), e não das
  // rotas dinâmicas inteiras ao abrir a página. O menu existe duas vezes no DOM
  // (lateral e inferior); sem isso cada rota era buscada em dobro.
  const prefetchSobDemanda = (href: string) => () => router.prefetch(href);

  const rank = rankFromLevel(level);
  const pct = Math.min(100, Math.round((xp / xpForLevel(level)) * 100));

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest/90 backdrop-blur-2xl z-50 hidden lg:flex flex-col justify-between shadow-[0_0_35px_rgba(0,0,0,0.6)]">
      <div className="flex flex-col">
        <div className="h-20 px-6 flex items-center gap-3 bg-surface-container-low/40">
          <SystemGlyph />
          <div className="flex flex-col">
            <span className="font-display text-headline-sm uppercase tracking-wider text-primary">
              SISTEMA
            </span>
            <span className="font-mono-label text-label-sm tracking-widest text-primary-fixed-dim">
              [{name.toUpperCase()}]
            </span>
          </div>
        </div>

        <div className="px-6 py-4 bg-surface-container-lowest/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono-label text-label-md text-on-surface">
                LVL. {level}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-tertiary-container/30 text-tertiary font-mono-label text-label-sm uppercase">
                RANK {rank}
              </span>
            </div>
            <span className="font-mono-label text-label-sm text-on-surface-variant">
              {pct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full shadow-[0_0_8px_rgba(0,210,255,0.7)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 px-4 pt-4">
          {(isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS).map((item) => {
            const active = hrefAtivo.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onPointerEnter={prefetchSobDemanda(item.href)}
                onFocus={prefetchSobDemanda(item.href)}
                onTouchStart={prefetchSobDemanda(item.href)}
                onClick={() => setAlvo({ href: item.href, de: pathname })}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all uppercase tracking-wider font-mono-label text-label-md ${
                  active
                    ? "bg-primary-container text-on-primary-container font-bold shadow-[0_0_20px_rgba(0,210,255,0.35)]"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span>[{item.label}]</span>
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all font-mono-label text-label-md uppercase tracking-wider text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>[SAIR]</span>
          </button>
        </nav>
      </div>

      {isPenalty && (
        <div className="p-4 m-4 rounded-xl bg-error-container/30 backdrop-blur-md animate-penalty-pulse">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-error text-[20px]">
              warning
            </span>
            <div className="flex flex-col">
              <span className="font-mono-label text-label-sm font-bold text-error uppercase tracking-wider">
                PENALIDADE ATIVA
              </span>
              <span className="font-body text-body-sm text-on-error-container leading-tight mt-0.5">
                Descumprimento acionará Sobrevivência Imediata na Zona de
                Punição.
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SystemGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path
        d="M12 1 L22 12 L12 23 L2 12 Z"
        fill="url(#sysGrad)"
        stroke="#47d6ff"
        strokeWidth="1"
      />
      <defs>
        <linearGradient id="sysGrad" x1="2" y1="1" x2="22" y2="23">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
