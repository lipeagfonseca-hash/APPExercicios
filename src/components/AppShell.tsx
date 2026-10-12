// ============================================================================
// CASCO DO APP
// ----------------------------------------------------------------------------
// Partial Prerendering: este componente é gerado no build e servido na hora.
//  - A navegação (barra lateral, cabeçalho, menu inferior) é dinâmica e fica em <Suspense>
//    com esqueleto próprio.
//  - O conteúdo da página (`children`) ocupa o casco: páginas estáticas já chegam prontas e
//    as dinâmicas mostram o loading.tsx da própria rota até os dados chegarem.
// ============================================================================

import { Suspense } from "react";
import Navegacao from "@/components/Navegacao";
import { EsqueletoDaNavegacao } from "@/components/EsqueletoDaPagina";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<EsqueletoDaNavegacao />}>
        <Navegacao />
      </Suspense>
      <div className="lg:pl-72">
        <main className="relative pt-28 w-full px-gutter lg:px-gutter-desktop min-h-screen pb-24 lg:pb-12">
          {children}
        </main>
      </div>
    </>
  );
}
