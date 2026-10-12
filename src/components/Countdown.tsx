"use client";

import { useEffect, useState } from "react";

export default function Countdown({
  initialSeconds,
  className,
}: {
  initialSeconds: number;
  className?: string;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return <span className={className}>{`${h}:${m}:${s}`}</span>;
}
