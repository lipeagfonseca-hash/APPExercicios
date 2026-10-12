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

export default function WeightGoalChart({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const data = [
    { label: "Hoje", peso: current },
    { label: "Meta", peso: target },
  ];

  return (
    <div className="h-56 rounded-xl bg-surface-container-lowest/80 backdrop-blur-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#0e2a38" />
          <XAxis dataKey="label" stroke="#67e8f9" fontSize={12} />
          <YAxis
            stroke="#67e8f9"
            fontSize={12}
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            contentStyle={{
              background: "#03070f",
              border: "1px solid rgba(34,211,238,0.3)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            name="Peso (kg)"
            stroke="#22d3ee"
            strokeWidth={3}
            dot={{ r: 5, fill: "#22d3ee" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
