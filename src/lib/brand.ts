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

export const getBrand = cache(async (): Promise<Brand> => {
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
    return EMPTY;
  }
});
