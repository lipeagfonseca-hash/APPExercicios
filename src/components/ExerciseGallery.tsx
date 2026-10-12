"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import { exerciseThumbUrl, normalizeSearch } from "@/lib/exerciseCatalog";

export type GalleryExercise = {
  id: string;
  name: string;
  nameEn: string;
  bodyPart: string;
  equipment: string;
  target: string;
};

const PAGE = 48;

export default function ExerciseGallery({ exercises }: { exercises: GalleryExercise[] }) {
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("Todos");
  const [equipment, setEquipment] = useState("Todos");
  const [visible, setVisible] = useState(PAGE);
  const [detailId, setDetailId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const deferredQuery = useDeferredValue(query);

  const index = useMemo(
    () =>
      exercises.map((e) => ({
        e,
        text: normalizeSearch(`${e.name} ${e.nameEn} ${e.target} ${e.bodyPart} ${e.equipment}`),
      })),
    [exercises],
  );

  const bodyParts = useMemo(
    () => ["Todos", ...Array.from(new Set(exercises.map((e) => e.bodyPart))).sort()],
    [exercises],
  );
  const equipments = useMemo(
    () => ["Todos", ...Array.from(new Set(exercises.map((e) => e.equipment))).sort()],
    [exercises],
  );

  const filtered = useMemo(() => {
    const terms = normalizeSearch(deferredQuery).split(" ").filter(Boolean);
    return index
      .filter(
        ({ e, text }) =>
          (bodyPart === "Todos" || e.bodyPart === bodyPart) &&
          (equipment === "Todos" || e.equipment === equipment) &&
          terms.every((t) => text.includes(t)),
      )
      .map(({ e }) => e);
  }, [index, deferredQuery, bodyPart, equipment]);

  // Reset pagination whenever the filters change.
  const filterKey = `${deferredQuery}|${bodyPart}|${equipment}`;
  const [lastKey, setLastKey] = useState(filterKey);
  if (lastKey !== filterKey) {
    setLastKey(filterKey);
    setVisible(PAGE);
  }

  // Load more cards as the user nears the bottom.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisible((v) => v + PAGE);
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const selectClass =
    "rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2 font-body text-body-sm text-on-surface";

  return (
    <div className="flex flex-col gap-4">
      {detailId && <ExerciseDetailModal id={detailId} onClose={() => setDetailId(null)} />}

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar (ex: supino, flexão, tríceps)"
          className={`${selectClass} min-w-0 flex-1 basis-60`}
        />
        <select
          value={bodyPart}
          onChange={(e) => setBodyPart(e.target.value)}
          className={selectClass}
          aria-label="Região do corpo"
        >
          {bodyParts.map((b) => (
            <option key={b} value={b}>
              {b === "Todos" ? "Todas as regiões" : b}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className={selectClass}
          aria-label="Equipamento"
        >
          {equipments.map((b) => (
            <option key={b} value={b}>
              {b === "Todos" ? "Todos os equipamentos" : b}
            </option>
          ))}
        </select>
      </div>

      <p className="font-mono-label text-label-sm uppercase tracking-wider text-on-surface-variant">
        {filtered.length} de {exercises.length} exercícios
      </p>

      {filtered.length === 0 ? (
        <p className="font-body text-body-md text-on-surface-variant">
          Nenhum exercício encontrado com esses filtros.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {shown.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => setDetailId(ex.id)}
                className="flex w-full flex-col overflow-hidden rounded-lg border border-primary-container/10 bg-surface-container-lowest/80 text-left transition-colors hover:border-primary-container/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={exerciseThumbUrl(ex.id)}
                  alt={ex.name}
                  width={180}
                  height={180}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full bg-surface-container-low object-cover"
                />
                <span className="flex flex-col gap-0.5 p-2">
                  <span className="line-clamp-2 font-body text-body-sm font-semibold text-on-surface">
                    {ex.name}
                  </span>
                  <span className="truncate font-mono-label text-label-sm text-on-surface-variant">
                    {ex.target} · {ex.equipment}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {shown.length < filtered.length && <div ref={sentinelRef} aria-hidden className="h-8" />}

      <p className="font-mono-label text-label-sm text-on-surface-variant">
        Mídia © Gym visual — gymvisual.com
      </p>
    </div>
  );
}
