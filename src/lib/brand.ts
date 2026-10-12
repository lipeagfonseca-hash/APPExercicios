import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { BRAND_SLOTS, isBrandSlot, type Brand } from "@/lib/brandSlots";

export { BRAND_SLOTS, isBrandSlot };
export type { Brand, BrandSlot } from "@/lib/brandSlots";

export const BRAND_KEY_PREFIX = "brand.";

// Only accept URLs that point at our public Blob store.
export function isBrandUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith("/brand/")
    );
  } catch {
    return false;
  }
}

const EMPTY: Brand = { logo: null, loginBackground: null, favicon: null, loginWindow: null };

// A identidade visual é igual para todos os usuários e muda raramente (só pelo painel do
// admin). Por isso fica em memória por alguns segundos, em vez de ir ao banco a cada
// requisição. Cada instância da função tem o seu próprio cache; o admin limpa o da
// instância que atendeu a alteração e as demais se atualizam sozinhas em até o TTL.
const SEGUNDOS_DE_VALIDADE_DO_CACHE = 60;
let cacheDaMarca: { valor: Brand; expiraEm: number } | null = null;

/** Descarta o cache em memória (chamado quando o admin altera ou remove uma imagem). */
export function limparCacheDaMarca() {
  cacheDaMarca = null;
}

async function lerMarcaDoBanco(): Promise<Brand> {
  const rows = await prisma.appSetting.findMany({
    where: { key: { startsWith: BRAND_KEY_PREFIX } },
  });
  const brand: Brand = { ...EMPTY };
  for (const row of rows) {
    const slot = row.key.slice(BRAND_KEY_PREFIX.length);
    if (isBrandSlot(slot) && isBrandUrl(row.value)) brand[slot] = row.value;
  }
  return brand;
}

export const getBrand = cache(async (): Promise<Brand> => {
  if (cacheDaMarca && Date.now() < cacheDaMarca.expiraEm) return cacheDaMarca.valor;
  try {
    const valor = await lerMarcaDoBanco();
    cacheDaMarca = { valor, expiraEm: Date.now() + SEGUNDOS_DE_VALIDADE_DO_CACHE * 1000 };
    return valor;
  } catch {
    return EMPTY; // falha no banco: mostra o visual padrão e não guarda no cache
  }
});
