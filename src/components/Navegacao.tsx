// ============================================================================
// NAVEGAÇÃO DO APP (parte DINÂMICA do layout)
// ----------------------------------------------------------------------------
// Barra lateral, cabeçalho e menu inferior dependem da sessão e do banco (nível, XP,
// contagem até a virada do dia), então não entram no "casco" pré-renderizado. O layout
// do app a envolve em <Suspense> com um esqueleto: o esqueleto aparece na hora, vindo
// do CDN, e esta parte chega por streaming assim que a função responde.
// ============================================================================

import { auth } from "@/lib/auth";
import { carregarVisaoDoDia } from "@/lib/rotacaoServico";
import { segundosAteMeiaNoite } from "@/lib/diaBrasilia";
import { isAdminEmail } from "@/lib/admin";
import Sidebar from "@/components/Sidebar";
import HudHeader from "@/components/HudHeader";
import BottomNav from "@/components/BottomNav";

export default async function Navegacao() {
  const session = await auth();
  if (!session?.user) return null;

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
      <BottomNav />
    </>
  );
}
