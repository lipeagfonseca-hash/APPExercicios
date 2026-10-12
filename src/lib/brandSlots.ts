export const BRAND_SLOTS = {
  logo: { label: "Logo", hint: "512×512 png/svg, fundo transparente" },
  loginBackground: { label: "Fundo da tela de login", hint: "1920×1080 webp/jpg, até ~300 KB" },
  favicon: { label: "Favicon", hint: "512×512 png (ou ico/svg)" },
  loginWindow: { label: "Janela de login", hint: "Imagem de fundo do cartão de login" },
} as const;

export type BrandSlot = keyof typeof BRAND_SLOTS;

export type Brand = Record<BrandSlot, string | null>;

export function isBrandSlot(value: unknown): value is BrandSlot {
  return typeof value === "string" && value in BRAND_SLOTS;
}
