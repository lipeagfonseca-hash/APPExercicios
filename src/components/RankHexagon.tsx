import { EXERCISE_RANKS, ExerciseRank } from "@/lib/rank";

const RANK_COLORS: Record<ExerciseRank, string> = {
  E: "#737373",
  D: "#b45309",
  C: "#059669",
  B: "#2563eb",
  A: "#7c3aed",
  S: "#22d3ee",
  SS: "#d946ef",
  SSS: "#ef4444",
};

const HEX_POINTS = "25,2 75,2 98,50 75,98 25,98 2,50";

export function RankBadge({ rank, size = "md" }: { rank: ExerciseRank; size?: "sm" | "md" | "lg" }) {
  const px = size === "lg" ? 64 : size === "sm" ? 36 : 48;
  const fontSize = size === "lg" ? 22 : size === "sm" ? 12 : 16;
  const color = RANK_COLORS[rank];

  return (
    <svg width={px} height={px} viewBox="0 0 100 100">
      <polygon
        points={HEX_POINTS}
        fill="rgba(255,255,255,0.03)"
        stroke={color}
        strokeWidth={4}
      />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={fontSize * 2.2}
        fontWeight="bold"
      >
        {rank}
      </text>
    </svg>
  );
}

export function RankLadder({ current }: { current: ExerciseRank }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {EXERCISE_RANKS.map((r) => (
        <div key={r} className={r === current ? "scale-110" : "opacity-30"}>
          <RankBadge rank={r} size="sm" />
        </div>
      ))}
    </div>
  );
}
