import { getBrand } from "@/lib/brand";
import BrandManager from "@/components/BrandManager";

export default async function BrandSettingsPage() {
  const brand = await getBrand();

  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-body-md text-on-surface-variant">
        Logo, fundo da tela de login, favicon e janela de login.
      </p>
      <BrandManager brand={brand} />
    </div>
  );
}
