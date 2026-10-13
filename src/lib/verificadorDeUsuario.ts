// ============================================================================
// VERIFICADOR DE USUÁRIO ATIVO (regra pura, testada)
// ----------------------------------------------------------------------------
// A sessão é um JWT: sozinha ela continua válida até expirar, mesmo se a conta for
// desativada ou apagada. Para a revogação valer em minutos, cada função confere no
// banco se o usuário ainda existe e está ativo, mas no máximo uma vez por
// `validadeMs` por usuário (guardado na memória da instância), para não consultar o
// banco a cada pedido.
// ============================================================================

export type BuscarUsuario = (id: string) => Promise<{ desativadoEm: Date | null } | null>;

export function criarVerificadorDeUsuario(buscar: BuscarUsuario, validadeMs: number, agora: () => number = Date.now) {
  const memoria = new Map<string, { ativo: boolean; ate: number }>();

  return async function usuarioAtivo(id: string): Promise<boolean> {
    const lembrado = memoria.get(id);
    if (lembrado && lembrado.ate > agora()) return lembrado.ativo;

    const usuario = await buscar(id);
    const ativo = usuario !== null && usuario.desativadoEm === null;
    memoria.set(id, { ativo, ate: agora() + validadeMs });

    // Evita crescer sem limite numa instância que vive muito tempo.
    if (memoria.size > 1000) {
      for (const [chave, valor] of memoria) if (valor.ate <= agora()) memoria.delete(chave);
    }
    return ativo;
  };
}
