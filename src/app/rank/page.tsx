// ============================================================================
// RANK E ATRIBUTOS
// ----------------------------------------------------------------------------
// Tudo vem do histórico real de treinos concluídos (veja src/lib/estatisticas.ts):
//  - o rank de cada exercício vem do tempo de esforço acumulado nele;
//  - os atributos (STR/AGI/END/VIT) são recalculados desse mesmo histórico.
// ============================================================================

import { auth } from "@/lib/auth";
import { carregarEstatisticas } from "@/lib/estatisticas";
import { DESCRICAO_DOS_ATRIBUTOS, type Atributo } from "@/lib/atributos";
import { RankBadge, RankLadder } from "@/components/RankHexagon";
import ShareCardButton from "@/components/ShareCardButton";

const ORDEM_DOS_ATRIBUTOS: Atributo[] = ["STR", "AGI", "END", "VIT"];

function formatarMinutos(minutos: number) {
  return Number.isInteger(minutos) ? `${minutos} min` : `${minutos.toFixed(1).replace(".", ",")} min`;
}

export default async function RankPage() {
  const session = await auth();
  const { ranks, atributos, treinosConcluidos } = await carregarEstatisticas(session!.user.id);

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="font-display text-headline-lg uppercase text-on-surface">Atributos</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ORDEM_DOS_ATRIBUTOS.map((chave) => (
          <div
            key={chave}
            className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4"
          >
            <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
              {chave} · {DESCRICAO_DOS_ATRIBUTOS[chave].nome}
            </span>
            <div className="font-display text-headline-md text-on-surface">{atributos[chave]}</div>
            <p className="font-body text-[11px] leading-snug text-on-surface-variant">
              {DESCRICAO_DOS_ATRIBUTOS[chave].comoCresce}
            </p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-headline-md uppercase text-on-surface">Rank por exercício</h2>
      <p className="font-body text-body-md text-on-surface-variant max-w-2xl">
        O rank de cada exercício cresce com o tempo de esforço acumulado nele (de E até SSS). Conclua os
        treinos da rotação para subir.
      </p>

      {ranks.length === 0 ? (
        <p className="font-body text-body-sm text-on-surface-variant">
          Conclua um treino para começar a ranquear seus exercícios.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranks.map((row) => (
            <div
              key={row.name}
              className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-headline-sm text-on-surface">{row.name}</h2>
                  <p className="font-mono-label text-label-sm text-on-surface-variant">
                    {formatarMinutos(row.minutos)} de esforço
                  </p>
                  <p className="font-mono-label text-label-sm text-primary">
                    {row.proximo
                      ? `Faltam ${formatarMinutos(row.proximo.faltamMinutos)} para o rank ${row.proximo.rank}`
                      : "Rank máximo"}
                  </p>
                </div>
                <RankBadge rank={row.rank} size="lg" />
              </div>

              <RankLadder current={row.rank} />

              <div className="mt-3 flex justify-end">
                <ShareCardButton
                  data={{
                    title: row.name,
                    subtitle: `Rank ${row.rank}`,
                    stats: [
                      { label: "Esforço acumulado", value: formatarMinutos(row.minutos) },
                      { label: "Treinos concluídos", value: String(treinosConcluidos) },
                    ],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
