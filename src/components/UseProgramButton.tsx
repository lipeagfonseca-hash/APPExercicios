"use client";

import { useRouter } from "next/navigation";
import { Program } from "@/lib/programs";

export const PROGRAM_STORAGE_KEY = "arise:selected-program";

export default function UseProgramButton({ program }: { program: Program }) {
  const router = useRouter();

  function handleClick() {
    sessionStorage.setItem(PROGRAM_STORAGE_KEY, JSON.stringify(program));
    router.push("/dashboard");
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-primary-container px-4 py-2 font-mono-label text-label-md uppercase tracking-wider text-on-primary-container hover:shadow-[0_0_20px_rgba(0,210,255,0.5)]"
    >
      Usar este treino
    </button>
  );
}
