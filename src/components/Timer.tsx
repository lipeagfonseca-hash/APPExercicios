"use client";

import { useEffect, useRef, useState } from "react";
import { beep } from "@/lib/beep";

const PRESETS = [30, 60, 90, 120];

export default function Timer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          beep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function selectPreset(seconds: number) {
    setDuration(seconds);
    setRemaining(seconds);
    setRunning(false);
  }

  function reset() {
    setRemaining(duration);
    setRunning(false);
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
      <h2 className="mb-3 font-mono-label text-label-md uppercase tracking-wider text-primary">
        Cronômetro de descanso
      </h2>
      <div className="mb-3 text-center font-mono-label text-headline-xl text-on-surface tabular-nums">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
      <div className="mb-3 flex justify-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => selectPreset(preset)}
            className={`rounded-lg px-3 py-1 font-mono-label text-label-sm ${
              duration === preset
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)]"
        >
          {running ? "Pausar" : "Iniciar"}
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-primary-container/40 px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-primary hover:bg-primary-container/10"
        >
          Resetar
        </button>
      </div>
    </div>
  );
}
