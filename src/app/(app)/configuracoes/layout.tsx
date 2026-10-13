import { Suspense } from "react";
import { redirect } from "next/navigation";
import { sessaoDoServidor } from "@/lib/sessao";
import { isAdminEmail } from "@/lib/admin";
import SettingsTabs from "@/components/SettingsTabs";
import { EsqueletoDeLista } from "@/components/EsqueletoDaPagina";

// A checagem de admin lê a sessão (dado de cada requisição), então fica num componente
// dentro de <Suspense>: o título e as abas fazem parte do casco pré-renderizado.
async function SomenteAdmin({ children }: { children: React.ReactNode }) {
  const session = await sessaoDoServidor();
  if (!isAdminEmail(session?.user?.email)) redirect("/dashboard");
  return <>{children}</>;
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">
        Configurações gerais
      </h1>
      <SettingsTabs />
      <Suspense fallback={<EsqueletoDeLista />}>
        <SomenteAdmin>{children}</SomenteAdmin>
      </Suspense>
    </div>
  );
}
