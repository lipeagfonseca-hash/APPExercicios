"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Missão", icon: "assignment_late" },
  { href: "/rank", label: "Rank", icon: "monitoring" },
  { href: "/programas", label: "Treinos", icon: "swords" },
  { href: "/exercicios", label: "Exerc.", icon: "sports_gymnastics" },
  { href: "/calendario", label: "Calend.", icon: "calendar_month" },
  { href: "/nutricao", label: "Nutrição", icon: "nutrition" },
  { href: "/conquistas", label: "Conq.", icon: "inventory_2" },
];

export default function BottomNav() {
  const pathname = usePathname();
  // Destaque OTIMISTA: o item clicado fica ativo na hora, antes de a página chegar.
  // Guardamos de qual rota o clique partiu; quando a rota muda, o alvo deixa de valer.
  const [alvo, setAlvo] = useState<{ href: string; de: string } | null>(null);
  const hrefAtivo = alvo && alvo.de === pathname ? alvo.href : pathname;


  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-container/20 bg-surface-container-lowest/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {ITEMS.map((item) => {
          const active = hrefAtivo.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAlvo({ href: item.href, de: pathname })}
              className={`flex flex-col items-center gap-1 rounded px-2 py-1 font-mono-label text-label-sm ${
                active ? "text-primary-container" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
