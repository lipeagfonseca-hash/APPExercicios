"use client";

import { useEffect, useState } from "react";
import { exerciseGifUrl } from "@/lib/exerciseCatalog";

type Detail = {
  id: string;
  namePt: string;
  nameEn: string;
  bodyPart: string;
  equipment: string;
  target: string;
  secondary: string[];
  instructionsEn: string | null;
  instructionsEs: string | null;
};

export default function ExerciseDetailModal({
  id,
  instrucaoCurta,
  onClose,
}: {
  id: string;
  /** Instrução curta em português (da configuração do treino), mostrada primeiro. */
  instrucaoCurta?: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/exercicios/${id}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setDetail(data.exercise))
      .catch((e) => {
        if (e?.name !== "AbortError") setFailed(true);
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const instructions = detail
    ? (lang === "es" ? detail.instructionsEs : detail.instructionsEn) ??
      detail.instructionsEn ??
      detail.instructionsEs
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do exercício"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-primary-container/30 bg-surface-container-lowest p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-headline-sm uppercase tracking-wider text-primary">
              {detail?.namePt ?? "Carregando..."}
            </h3>
            {detail && (
              <p className="font-mono-label text-label-sm text-on-surface-variant">
                {detail.nameEn}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="font-mono-label text-label-md text-on-surface-variant hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={exerciseGifUrl(id)}
          alt={detail ? `Demonstração: ${detail.namePt}` : "Demonstração do exercício"}
          width={180}
          height={180}
          decoding="async"
          className="mx-auto mb-1 h-[180px] w-[180px] rounded-lg bg-surface-container-low object-contain"
        />
        <p className="mb-3 text-center font-mono-label text-label-sm text-on-surface-variant">
          © Gym visual — gymvisual.com
        </p>

        {instrucaoCurta && (
          <p className="mb-3 rounded-lg bg-primary-container/10 px-3 py-2 font-body text-body-sm text-on-surface">
            {instrucaoCurta}
          </p>
        )}

        {failed && (
          <p className="font-mono-label text-label-sm text-error">
            Não foi possível carregar os detalhes.
          </p>
        )}

        {detail && (
          <>
            <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 font-body text-body-sm">
              <dt className="text-on-surface-variant">Região</dt>
              <dd className="text-on-surface">{detail.bodyPart}</dd>
              <dt className="text-on-surface-variant">Músculo alvo</dt>
              <dd className="text-on-surface">{detail.target}</dd>
              <dt className="text-on-surface-variant">Equipamento</dt>
              <dd className="text-on-surface">{detail.equipment}</dd>
            </dl>

            {instructions && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Instruções
                  </span>
                  <span className="flex gap-2 font-mono-label text-label-sm">
                    {(["es", "en"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        className={
                          lang === l ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                        }
                      >
                        {l === "es" ? "ESP" : "ENG"}
                      </button>
                    ))}
                  </span>
                </div>
                <p className="font-body text-body-sm text-on-surface">{instructions}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
