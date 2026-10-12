"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; volume: number };

export default function HistoryChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <p className="font-body text-body-sm text-on-surface-variant">
        Registre treinos para ver seu progresso aqui.
      </p>
    );
  }

  return (
    <div className="h-64 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2534" />
          <XAxis dataKey="date" stroke="#bbc9cf" fontSize={12} />
          <YAxis stroke="#bbc9cf" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#0a0e17",
              border: "1px solid rgba(0,210,255,0.3)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="volume"
            name="Volume (kg)"
            stroke="#00d2ff"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
