import { cacheLife, cacheTag } from "next/cache";
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

/**
 * A identidade visual é igual para todos e muda raramente (só pelo painel do admin), então
 * fica no cache do Next (`use cache`) em vez de ir ao banco a cada requisição. Isso também
 * permite que o layout raiz entre no "casco" pré-renderizado. Quando o admin altera ou
 * remove uma imagem, as rotas chamam revalidateTag("brand", { expire: 0 }).
 */
export async function getBrand(): Promise<Brand> {
  "use cache";
  cacheTag("brand");
  cacheLife("hours");

  try {
    const rows = await prisma.appSetting.findMany({
      where: { key: { startsWith: BRAND_KEY_PREFIX } },
    });
    const brand: Brand = { ...EMPTY };
    for (const row of rows) {
      const slot = row.key.slice(BRAND_KEY_PREFIX.length);
      if (isBrandSlot(slot) && isBrandUrl(row.value)) brand[slot] = row.value;
    }
    return brand;
  } catch {
    return EMPTY; // falha no banco: mostra o visual padrão
  }
}
