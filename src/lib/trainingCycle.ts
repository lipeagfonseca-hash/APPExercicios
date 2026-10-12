import { PROGRAMS, Program, ProgramTrack } from "@/lib/programs";

const ANCHOR = Date.UTC(2024, 0, 1); // fixed reference: cycle day 0

type Slot = { type: "REST" } | { type: "TRAIN"; programId: string };

// 2 training days + 1 rest day, repeated.
const CYCLES: Record<ProgramTrack, Slot[]> = {
  "low-impact": [
    { type: "TRAIN", programId: "low-a" },
    { type: "TRAIN", programId: "low-b" },
    { type: "REST" },
    { type: "TRAIN", programId: "low-c" },
    { type: "TRAIN", programId: "low-d" },
    { type: "REST" },
  ],
  classic: [
    { type: "TRAIN", programId: "hiit-q48-a" },
    { type: "TRAIN", programId: "hiit-q48-b" },
    { type: "REST" },
    { type: "TRAIN", programId: "hiit-q48-c" },
    { type: "TRAIN", programId: "hiit-q48-d" },
    { type: "REST" },
  ],
};

// Which program set drives "Programa do dia" and the calendar.
export const ACTIVE_TRACK: ProgramTrack = "low-impact";
const CYCLE = CYCLES[ACTIVE_TRACK];

export type DaySchedule =
  | { type: "REST" }
  | { type: "TRAIN"; program: Program };

function toUtcDateOnly(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function getScheduleForDate(date: Date): DaySchedule {
  const dayIndex = Math.floor((toUtcDateOnly(date) - ANCHOR) / 86_400_000);
  const slot = CYCLE[((dayIndex % CYCLE.length) + CYCLE.length) % CYCLE.length];

  if (slot.type === "REST") return { type: "REST" };

  const program = PROGRAMS.find((p) => p.id === slot.programId)!;
  return { type: "TRAIN", program };
}
