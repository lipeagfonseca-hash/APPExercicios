"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { BRAND_SLOTS, type Brand, type BrandSlot } from "@/lib/brandSlots";

const MAX_BYTES = 8 * 1024 * 1024;

export default function BrandManager({ brand }: { brand: Brand }) {
  const router = useRouter();
  const [busy, setBusy] = useState<BrandSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Partial<Record<BrandSlot, HTMLInputElement | null>>>({});

  async function handleFile(slot: BrandSlot, file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Arquivo acima de 8 MB.");
      return;
    }
    setBusy(slot);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const blob = await upload(`brand/${slot}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/brand/upload",
      });
      const res = await fetch("/api/admin/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, url: blob.url }),
      });
      if (!res.ok) throw new Error("Não foi possível salvar a imagem.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setBusy(null);
      const input = inputs.current[slot];
      if (input) input.value = "";
    }
  }

  async function handleRemove(slot: BrandSlot) {
    setError(null);
    setBusy(slot);
    const res = await fetch("/api/admin/brand", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot }),
    });
    setBusy(null);
    if (!res.ok) {
      setError("Não foi possível remover.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="font-mono-label text-label-sm text-error">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(BRAND_SLOTS) as BrandSlot[]).map((slot) => {
          const url = brand[slot];
          const loading = busy === slot;
          return (
            <div
              key={slot}
              className="flex flex-col gap-3 rounded-lg border border-primary-container/20 bg-surface-container-lowest/80 p-4"
            >
              <div>
                <h2 className="font-mono-label text-label-md uppercase tracking-wider text-on-surface">
                  {BRAND_SLOTS[slot].label}
                </h2>
                <p className="font-body text-body-sm text-on-surface-variant">
                  {BRAND_SLOTS[slot].hint}
                </p>
              </div>
              <div
                className="h-36 rounded-md border border-primary-container/10 bg-surface-container-low bg-contain bg-center bg-no-repeat"
                style={url ? { backgroundImage: `url("${url}")` } : undefined}
              >
                {!url && (
                  <div className="flex h-full items-center justify-center font-mono-label text-label-sm text-on-surface-variant">
                    PADRÃO
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={(el) => {
                    inputs.current[slot] = el;
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                  disabled={loading}
                  onChange={(e) => handleFile(slot, e.target.files?.[0])}
                  className="min-w-0 flex-1 font-body text-body-sm text-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-primary-container file:px-3 file:py-1.5 file:font-mono-label file:text-label-sm file:uppercase file:text-on-primary-container"
                />
                {url && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleRemove(slot)}
                    className="rounded-md border border-error/40 px-3 py-1.5 font-mono-label text-label-sm uppercase text-error disabled:opacity-50"
                  >
                    Remover
                  </button>
                )}
              </div>
              {loading && (
                <p className="font-mono-label text-label-sm text-primary">Processando...</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
