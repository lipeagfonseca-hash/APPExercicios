import { auth } from "@/lib/auth";
import { carregarVisaoDoDia } from "@/lib/rotacaoServico";
import { segundosAteMeiaNoite } from "@/lib/diaBrasilia";
import { isAdminEmail } from "@/lib/admin";
import Sidebar from "@/components/Sidebar";
import HudHeader from "@/components/HudHeader";
import BottomNav from "@/components/BottomNav";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <main className="min-h-screen">{children}</main>;
  }

  // Calculada uma vez por requisição (a página também usa a mesma visão).
  const visao = await carregarVisaoDoDia(session.user.id);
  const treinoEmAtraso = visao.estado.tipo === "TREINO_PENDENTE" && visao.estado.diasEmAtraso > 0;

  return (
    <>
      <Sidebar
        name={session.user.name ?? "Caçador"}
        level={visao.nivel}
        xp={visao.xp}
        isPenalty={treinoEmAtraso}
        isAdmin={isAdminEmail(session.user.email)}
      />
      {/* O dia vira à 00h de Brasília */}
      <HudHeader secondsLeft={segundosAteMeiaNoite()} />
      <div className="lg:pl-72">
        <main className="relative pt-28 w-full px-gutter lg:px-gutter-desktop min-h-screen pb-24 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </>
  );
}
