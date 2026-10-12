"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/configuracoes/usuarios", label: "Usuários" },
  { href: "/configuracoes/identidade-visual", label: "Identidade visual" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 border-b border-primary-container/20">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 font-mono-label text-label-md uppercase tracking-wider transition-colors ${
              active
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
