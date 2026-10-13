// ============================================================================
// PROGRAMAS (somente leitura)
// ----------------------------------------------------------------------------
// Mostra a rotação configurada e o conteúdo de cada treino. O usuário NÃO
// escolhe o treino: quem decide é o sistema (veja o Dashboard).
// ============================================================================

import { sessaoObrigatoria } from "@/lib/sessao";
import { carregarVisaoDoDia } from "@/lib/rotacaoServico";
import { ID_DO_DESCANSO, SEQUENCIA_DA_ROTACAO } from "@/config/rotacao";
import { duracaoTotalEmSegundos, TREINOS } from "@/config/treinos";
import { formatClock } from "@/lib/timedProgram";

export default async function ProgramsPage() {
  const session = await sessaoObrigatoria();
  const visao = await carregarVisaoDoDia(session.user.id);

  const itemDeHoje =
    visao.estado.tipo === "TREINO_PENDENTE"
      ? visao.estado.item
      : visao.estado.tipo === "DESCANSO"
        ? ID_DO_DESCANSO
        : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">Rotação de treinos</h1>
      <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
        O sistema define o treino de cada dia. Se você não concluir um treino, ele continua pendente no dia
        seguinte: a rotação nunca pula.
      </p>

      <div className="flex flex-wrap items-center gap-2 font-mono-label text-label-sm uppercase">
        {SEQUENCIA_DA_ROTACAO.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span
              className={`rounded border px-2 py-1 ${
                i === visao.ponteiro.posicao
                  ? "border-primary-container bg-primary-container/15 text-primary"
                  : "border-outline-variant/30 text-on-surface-variant"
              }`}
            >
              {item === ID_DO_DESCANSO ? "Descanso" : `Treino ${item}`}
            </span>
            <span className="text-on-surface-variant">→</span>
          </span>
        ))}
        <span className="text-on-surface-variant">recomeça</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(TREINOS).map(([id, treino]) => (
          <div
            key={id}
            className={`flex flex-col gap-3 rounded-xl backdrop-blur-xl p-4 ${
              id === itemDeHoje
                ? "bg-primary-container/10 shadow-[0_0_25px_rgba(0,210,255,0.2)]"
                : "bg-surface-container-lowest/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary-container/10 px-2 py-0.5 font-mono-label text-label-sm uppercase text-primary">
                Treino {id}
              </span>
              {id === itemDeHoje && (
                <span className="rounded bg-primary-container px-2 py-0.5 font-mono-label text-label-sm uppercase text-on-primary-container">
                  Hoje
                </span>
              )}
            </div>
            <h2 className="font-display text-headline-sm text-on-surface">{treino.name}</h2>
            <p className="font-body text-body-sm text-on-surface-variant">{treino.description}</p>
            <ul className="font-mono-label text-label-sm text-on-surface-variant">
              <li className="text-primary">• {formatClock(duracaoTotalEmSegundos(id))} no total</li>
              {treino.exercises.map((ex) => (
                <li key={ex.name}>
                  • {ex.name} ({ex.sets.length}x{treino.timed?.workSeconds}s)
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
