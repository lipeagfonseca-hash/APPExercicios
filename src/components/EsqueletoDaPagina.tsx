// ============================================================================
// ESQUELETOS DE CARREGAMENTO
// ----------------------------------------------------------------------------
// Mostrados na hora pelo Next (arquivos loading.tsx) enquanto a página de verdade
// chega do servidor. Usam os mesmos cartões translúcidos do SISTEMA, só que
// pulsando, para a tela parecer viva em vez de "travada".
// ============================================================================

const BLOCO = "animate-pulse rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl";
const LINHA = "animate-pulse rounded bg-surface-container-high/70";

/** Título da página (a barra grossa no topo). */
function Titulo() {
  return <div className={`${LINHA} h-9 w-56`} aria-hidden />;
}

/** Esqueleto do dashboard: cartão do treino, três indicadores e a lista de recentes. */
export function EsqueletoDoDashboard() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Carregando o treino do dia">
      <div className={`${LINHA} h-4 w-72`} aria-hidden />
      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12 lg:gap-gutter-desktop">
        <section className="flex flex-col gap-6 lg:col-span-8">
          <div className={`${BLOCO} h-20 p-4`} aria-hidden>
            <div className={`${LINHA} h-3 w-28`} />
            <div className={`${LINHA} mt-3 h-6 w-64`} />
          </div>
          <div className={`${BLOCO} flex flex-col gap-4 p-5`} aria-hidden>
            <div className={`${LINHA} h-4 w-48`} />
            <div className={`${LINHA} h-8 w-72`} />
            <div className={`${LINHA} h-10 w-full`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-lg bg-surface-container/40 p-2">
                  <div className={`${LINHA} h-[88px] w-[88px]`} />
                  <div className={`${LINHA} h-3 w-20`} />
                </div>
              ))}
            </div>
            <div className={`${LINHA} h-10 w-40`} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={`${BLOCO} h-24 p-4`}>
                <div className={`${LINHA} h-3 w-24`} />
                <div className={`${LINHA} mt-3 h-6 w-32`} />
              </div>
            ))}
          </div>
        </section>
        <aside className="flex flex-col gap-6 lg:col-span-4" aria-hidden>
          <div className={`${BLOCO} h-56`} />
          <div className={`${BLOCO} h-64`} />
        </aside>
      </div>
    </div>
  );
}

/** Esqueleto genérico: título + grade de cartões (Rank, Conquistas, Programas, Exercícios...). */
export function EsqueletoDeGrade({ cartoes = 6, alto = "h-36" }: { cartoes?: number; alto?: string }) {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Carregando">
      <Titulo />
      <div className={`${LINHA} h-4 w-96 max-w-full`} aria-hidden />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: cartoes }, (_, i) => (
          <div key={i} className={`${BLOCO} ${alto} p-4`}>
            <div className={`${LINHA} h-5 w-40`} />
            <div className={`${LINHA} mt-3 h-3 w-28`} />
            <div className={`${LINHA} mt-6 h-3 w-full`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Esqueleto de calendário: título + grade de 7 colunas. */
export function EsqueletoDeCalendario() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Carregando o calendário">
      <Titulo />
      <div className={`${BLOCO} grid grid-cols-7 gap-2 p-4`} aria-hidden>
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} className={`${LINHA} h-16 lg:h-24`} />
        ))}
      </div>
    </div>
  );
}

/** Esqueleto de listas e gráficos (Histórico, Nutrição, Configurações). */
export function EsqueletoDeLista() {
  return (
    <div className="flex w-full flex-col gap-6" role="status" aria-label="Carregando">
      <Titulo />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-hidden>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={`${BLOCO} h-24 p-4`}>
            <div className={`${LINHA} h-3 w-28`} />
            <div className={`${LINHA} mt-3 h-6 w-20`} />
          </div>
        ))}
      </div>
      <div className={`${BLOCO} h-64`} aria-hidden />
    </div>
  );
}
