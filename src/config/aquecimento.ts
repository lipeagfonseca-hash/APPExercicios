// ============================================================================
// AQUECIMENTO (manter função e banco acordados nos horários de treino)
// ----------------------------------------------------------------------------
// Sem isto, a primeira abertura depois de um tempo parado leva ~3 s: a função da
// Vercel precisa "ligar" e o Neon (plano Free) dorme após 5 min sem uso e não
// pode ser mantido sempre ligado.
//
// Um agendamento do QStash (gratuito) chama /api/aquecer a cada 4 minutos SÓ nas
// janelas abaixo (horário de Brasília). O endpoint acorda o banco e renderiza as
// páginas principais, para que a primeira abertura do dia já encontre tudo quente.
//
// CUSTO / COTA: o Neon Free dá 100 CU-horas por mês. Com o compute mínimo (0,25 CU),
// cada hora acordada custa 0,25 CU-h. Janelas de 6 h/dia ≈ 180 h/mês ≈ 45 CU-h
// (45% da cota). Não aumente as janelas sem refazer essa conta: se a cota acabar,
// o Neon suspende o banco até o mês seguinte e o app para.
//
// IMPORTANTE: o agendamento do QStash (cron) e estas janelas devem coincidir. O
// endpoint confere a janela por conta própria; assim, um cron errado não gasta cota.
// Cron atual: CRON_TZ=America/Sao_Paulo */4 6-8,18-20 * * *
// Para pausar tudo na hora: defina AQUECIMENTO_ATIVO=false na Vercel (ou pause o
// agendamento no painel do QStash).
// ============================================================================

/** Hora inicial (inclusive) e final (exclusive), em horas cheias de Brasília. */
export const JANELAS_DE_AQUECIMENTO = [
  { deHora: 6, ateHora: 9 }, // manhã: 06:00 até 08:59
  { deHora: 18, ateHora: 21 }, // noite: 18:00 até 20:59
] as const;

/** Páginas renderizadas a cada aquecimento (cada rota é uma função separada na Vercel). */
export const PAGINAS_PARA_AQUECER = ["/dashboard", "/rank", "/programas", "/exercicios"] as const;

/**
 * Usuário interno usado só pelo aquecedor para abrir páginas protegidas. Não tem senha
 * utilizável (não faz login), não é administrador e não tem dados reais.
 * Criado por: node scripts/criar-usuario-aquecedor.cjs
 */
export const EMAIL_DO_USUARIO_AQUECEDOR = "aquecedor@interno.invalid";
