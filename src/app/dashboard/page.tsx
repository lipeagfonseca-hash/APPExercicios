// ============================================================================
// DASHBOARD
// ----------------------------------------------------------------------------
// O treino do dia É a missão. O servidor decide qual é (ou se é descanso) a
// partir do ponteiro da rotação; o usuário não escolhe.
// ============================================================================

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { carregarVisaoDoDia } from "@/lib/rotacaoServico";
import { formatClock } from "@/lib/timedProgram";
import { ID_DO_DESCANSO, SEQUENCIA_DA_ROTACAO } from "@/config/rotacao";
import {
  DETALHES_DO_ALONGAMENTO,
  DETALHES_DOS_TREINOS,
  PROGRAMA_DE_ALONGAMENTO,
  duracaoTotalEmSegundos,
  TREINOS,
  treinoPorId,
} from "@/config/treinos";
import SystemLogPanel from "@/components/SystemLogPanel";
import TimedProgram from "@/components/TimedProgram";

/** "A" → "Treino A · Pernas Seguras"; "DESCANSO" → "Descanso". */
function rotuloDoItem(item: string): string {
  if (item === ID_DO_DESCANSO) return "Descanso";
  // Registros antigos podem apontar para um treino que saiu da configuração.
  const nome = TREINOS[item]?.name;
  return nome ? `Treino ${item} · ${nome}` : `Treino ${item}`;
}

/** Item que vem depois do atual na rotação (ex.: posição 2 = Descanso → próximo é o Treino C). */
function itemSeguinte(posicao: number): string {
  return SEQUENCIA_DA_ROTACAO[(posicao + 1) % SEQUENCIA_DA_ROTACAO.length];
}

const CARTAO = "rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const visao = await carregarVisaoDoDia(userId);
  const { estado, ponteiro } = visao;

  const [logs, recentes] = await Promise.all([
    prisma.systemLog.findMany({
      where: { profile: { userId } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.treinoConcluido.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const pctXp = Math.min(100, Math.round((visao.xp / visao.xpParaProximoNivel) * 100));
  const diasEmAtraso = estado.tipo === "TREINO_PENDENTE" ? estado.diasEmAtraso : 0;

  // O que mostrar como "próximo treino da rotação".
  const proximoDaRotacao =
    estado.tipo === "TREINO_CONCLUIDO_HOJE" ? estado.proximo : itemSeguinte(ponteiro.posicao);

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full">
        <div className="absolute -top-10 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-tertiary-container/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-primary-container shadow-[0_0_10px_#00d2ff]" />
            <span className="font-mono-label text-label-md text-primary tracking-widest uppercase">
              [OVERLAY DIRECTIVE // SISTEMA ATIVO]
            </span>
          </div>
          <span className="font-mono-label text-label-sm text-on-surface-variant uppercase">
            SINC. NEURAL: {diasEmAtraso > 0 ? "INSTÁVEL" : "ESTÁVEL"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-gutter-desktop items-start">
          <section className="lg:col-span-8 flex flex-col gap-6">
            {/* ---------------- Treino do dia (a missão) ---------------- */}
            {estado.tipo === "TREINO_PENDENTE" && (
              <>
                <div className={`${CARTAO} flex flex-wrap items-center justify-between gap-3 p-4`}>
                  <div>
                    <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                      MISSÃO DIÁRIA
                    </span>
                    <div className="font-display text-headline-sm text-on-surface">
                      {rotuloDoItem(estado.item)}
                    </div>
                  </div>
                  <div className="text-right font-mono-label text-label-sm text-on-surface-variant">
                    <div>DURAÇÃO TOTAL: {formatClock(duracaoTotalEmSegundos(estado.item))}</div>
                    <div className="text-primary">CONCLUA O CRONÔMETRO PARA GANHAR XP</div>
                  </div>
                </div>
                <TimedProgram
                  key={estado.item}
                  program={treinoPorId(estado.item)}
                  rotulo={`Treino ${estado.item}`}
                  detalhes={DETALHES_DOS_TREINOS}
                />
              </>
            )}

            {estado.tipo === "TREINO_CONCLUIDO_HOJE" && (
              <section className={`${CARTAO} p-5 shadow-[0_0_25px_rgba(0,210,255,0.12)]`}>
                <span className="font-mono-label text-label-md uppercase tracking-wider text-primary">
                  [MISSÃO DIÁRIA CONCLUÍDA]
                </span>
                <h2 className="font-display text-headline-md text-on-surface">
                  Treino de hoje concluído
                </h2>
                <p className="mt-1 font-body text-body-sm text-on-surface-variant">
                  Recupere-se. O próximo da rotação é{" "}
                  <strong className="text-on-surface">{rotuloDoItem(estado.proximo)}</strong>, a partir de
                  amanhã.
                </p>
              </section>
            )}

            {estado.tipo === "DESCANSO" && (
              <>
                <section className={`${CARTAO} p-5`}>
                  <span className="font-mono-label text-label-md uppercase tracking-wider text-primary">
                    [DESCANSO / RECUPERAÇÃO]
                  </span>
                  <h2 className="font-display text-headline-md text-on-surface">Hoje é dia de descanso</h2>
                  <p className="mt-1 font-body text-body-sm text-on-surface-variant">
                    Sem treino hoje e sem cronômetro obrigatório. Se quiser, faça os alongamentos abaixo ou uma
                    caminhada leve de 15 a 20 minutos. Eles não dão XP, e o descanso não afeta a sua sequência.
                  </p>
                  <p className="mt-2 font-mono-label text-label-sm text-on-surface-variant">
                    PRÓXIMO: {rotuloDoItem(itemSeguinte(ponteiro.posicao))}
                  </p>
                </section>
                <TimedProgram
                  program={PROGRAMA_DE_ALONGAMENTO}
                  rotulo="Alongamentos"
                  detalhes={DETALHES_DO_ALONGAMENTO}
                  modo="livre"
                />
              </>
            )}

            {/* ---------------- Resumo: XP, sequência, próximo treino ---------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${CARTAO} p-4`}>
                <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                  XP · NÍVEL {visao.nivel}
                </span>
                <div className="font-display text-headline-sm text-on-surface">
                  {visao.xp} / {visao.xpParaProximoNivel}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className="h-full rounded-full bg-primary-container" style={{ width: `${pctXp}%` }} />
                </div>
              </div>
              <div className={`${CARTAO} p-4`}>
                <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                  SEQUÊNCIA ATUAL
                </span>
                <div className="font-display text-headline-sm text-on-surface">
                  {visao.sequenciaAtual} {visao.sequenciaAtual === 1 ? "treino" : "treinos"}
                </div>
                <span className="font-mono-label text-label-sm text-on-surface-variant">
                  RECORDE: {visao.melhorSequencia} · BÔNUS EM {visao.treinosParaOBonus}{" "}
                  {visao.treinosParaOBonus === 1 ? "TREINO" : "TREINOS"}
                </span>
              </div>
              <div className={`${CARTAO} p-4`}>
                <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                  PRÓXIMO DA ROTAÇÃO
                </span>
                <div className="font-display text-headline-sm text-on-surface">
                  {rotuloDoItem(proximoDaRotacao)}
                </div>
              </div>
            </div>

            {/* Zona de penalidade: apenas narrativa, sem efeito mecânico. */}
            <div className="p-5 rounded-xl bg-error-container/20 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-label text-label-md text-error uppercase tracking-wider">
                  [ZONA DE PENALIDADE]
                </span>
                <span className="material-symbols-outlined text-error text-[20px]">timer</span>
              </div>
              <span className="font-display text-headline-md text-error tracking-tight">
                DESERTO DOS CENTÍPEDES
              </span>
              <span className="block font-mono-label text-label-sm text-on-error-container mt-1">
                Ambiente de calor extremo com bestas mágicas classe-D sem pausa.
              </span>
              <div className="mt-4 pt-3 border-t border-error/20 font-mono-label text-label-sm text-error">
                {diasEmAtraso > 0
                  ? `STATUS: ATIVA · ${diasEmAtraso} DIA(S) COM O TREINO EM ATRASO. CONCLUA O TREINO PARA SAIR.`
                  : "STATUS: SUSPENSA"}
              </div>
            </div>

            {/* ---------------- Treinos concluídos recentes ---------------- */}
            <div>
              <h2 className="mb-3 font-mono-label text-label-md uppercase tracking-wider text-primary">
                Treinos recentes
              </h2>
              {recentes.length === 0 ? (
                <p className="font-body text-body-sm text-on-surface-variant">
                  Nenhum treino concluído ainda.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {recentes.map((r) => (
                    <li
                      key={r.id}
                      className={`${CARTAO} flex items-center justify-between gap-3 px-4 py-2`}
                    >
                      <span className="font-body text-body-md text-on-surface">
                        {rotuloDoItem(r.treinoId)}
                      </span>
                      <span className="font-mono-label text-label-sm text-on-surface-variant">
                        {r.dia.split("-").reverse().join("/")} · +{r.xpConcedido} XP
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-6">
            <SystemLogPanel logs={logs} />
            <div className="p-4 rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
                auto_awesome
              </span>
              <div className="flex flex-col">
                <span className="font-mono-label text-label-sm text-tertiary uppercase font-bold tracking-wider">
                  AURA DE MONARCA
                </span>
                <span className="font-body text-body-sm text-on-surface leading-tight mt-0.5">
                  A disciplina continuada converte esforço físico bruto em mana latente para o Despertar.
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
