"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  exerciseThumbUrl,
  type ExerciseSummary,
} from "@/lib/exerciseCatalog";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 180;

// Shared across instances so repeated searches are instant and cost no request.
const searchCache = new Map<string, ExerciseSummary[]>();

type Props = {
  value: string;
  exerciseId?: string;
  onTextChange: (value: string) => void;
  onPick: (exercise: ExerciseSummary) => void;
  onOpenDetail: (id: string) => void;
};

export default function ExercisePicker({
  value,
  exerciseId,
  onTextChange,
  onPick,
  onOpenDetail,
}: Props) {
  const listId = useId();
  const [items, setItems] = useState<ExerciseSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pickedRef = useRef(false);

  useEffect(() => {
    const query = value.trim().toLowerCase();
    if (pickedRef.current) {
      pickedRef.current = false;
      return;
    }
    if (query.length < MIN_CHARS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return;
    }

    const cached = searchCache.get(query);
    if (cached) {
      setItems(cached);
      setActive(0);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/exercicios?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { items: ExerciseSummary[] };
        searchCache.set(query, data.items);
        setItems(data.items);
        setActive(0);
      } catch {
        // aborted or offline: keep what is on screen
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function pick(item: ExerciseSummary) {
    pickedRef.current = true;
    setOpen(false);
    setItems([]);
    onPick(item);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && value.trim().length >= MIN_CHARS;

  return (
    <div ref={rootRef} className="relative flex flex-1 items-center gap-2">
      {exerciseId && (
        <button
          type="button"
          onClick={() => onOpenDetail(exerciseId)}
          aria-label="Ver demonstração do exercício"
          className="shrink-0 overflow-hidden rounded-md border border-primary-container/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exerciseThumbUrl(exerciseId)}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
            className="h-10 w-10 object-cover"
          />
        </button>
      )}
      <input
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        value={value}
        onChange={(e) => {
          pickedRef.current = false;
          onTextChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar exercício (ex: supino, flexão)"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-primary-container/20 bg-surface-container-lowest px-3 py-2"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-lg border border-primary-container/30 bg-surface-container-lowest shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        >
          {items.length === 0 && (
            <li className="px-3 py-2 font-mono-label text-label-sm text-on-surface-variant">
              {loading ? "Buscando..." : "Nenhum exercício no catálogo. O nome digitado será usado."}
            </li>
          )}
          {items.map((item, index) => (
            <li
              key={item.id}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(item);
              }}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                index === active ? "bg-primary-container/15" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exerciseThumbUrl(item.id)}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="h-10 w-10 shrink-0 rounded-md bg-surface-container-low object-cover"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-body text-body-md text-on-surface">
                  {item.name}
                </span>
                <span className="truncate font-mono-label text-label-sm text-on-surface-variant">
                  {item.target} · {item.equipment}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
