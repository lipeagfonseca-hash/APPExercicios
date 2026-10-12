// ============================================================================
// PAINEL DE RECOMPENSAS
// ----------------------------------------------------------------------------
// Só mostra recompensas que têm efeito real no sistema:
//  - bônus de XP por sequência (concedido automaticamente ao concluir o treino);
//  - o próximo nível (XP que falta);
//  - a próxima classe e o título que ela dá.
// Nenhuma "recompensa" decorativa (como restaurar HP/MP, que não existem mais).
// ============================================================================

import { BONUS_POR_SEQUENCIA, NIVEL_INICIAL_DE_CADA_CLASSE, TITULO_DE_CADA_CLASSE } from "@/config/xp";
import { classeDoNivel } from "@/lib/progressao";

type Props = {
  nivel: number;
  xp: number;
  xpParaProximoNivel: number;
  treinosParaOBonus: number;
};

export default function RecompensasPanel({ nivel, xp, xpParaProximoNivel, treinosParaOBonus }: Props) {
  const classe = classeDoNivel(nivel);
  const proximaClasse = NIVEL_INICIAL_DE_CADA_CLASSE.find((c) => c.nivel > nivel);

  return (
    <div className="rounded-xl bg-surface-container-lowest/85 backdrop-blur-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-primary-container/20">
        <h2 className="font-display text-headline-sm uppercase text-on-surface tracking-wider">Recompensas</h2>
        <span className="material-symbols-outlined text-primary-container text-[22px]">featured_seasonal_and_gifts</span>
      </div>

      <div>
        <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
          TÍTULO ATUAL · CLASSE {classe}
        </span>
        <div className="font-display text-headline-sm text-primary">{TITULO_DE_CADA_CLASSE[classe]}</div>
      </div>

      <ul className="flex flex-col gap-3 font-body text-body-sm text-on-surface">
        <li className="flex items-start gap-2">
          <span className="material-symbols-outlined text-tertiary text-[18px]">bolt</span>
          <span>
            <strong>+{BONUS_POR_SEQUENCIA.xp} XP</strong> de bônus em {treinosParaOBonus}{" "}
            {treinosParaOBonus === 1 ? "treino" : "treinos"} seguidos sem falhar.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">upgrade</span>
          <span>
            Faltam <strong>{xpParaProximoNivel - xp} XP</strong> para o nível {nivel + 1}.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="material-symbols-outlined text-primary-container text-[18px]">military_tech</span>
          <span>
            {proximaClasse ? (
              <>
                Classe <strong>{proximaClasse.classe}</strong> no nível {proximaClasse.nivel} (faltam{" "}
                {proximaClasse.nivel - nivel} {proximaClasse.nivel - nivel === 1 ? "nível" : "níveis"}) e o título{" "}
                <strong>{TITULO_DE_CADA_CLASSE[proximaClasse.classe]}</strong>.
              </>
            ) : (
              <>Você está na classe mais alta.</>
            )}
          </span>
        </li>
      </ul>
    </div>
  );
}
