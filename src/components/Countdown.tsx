"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export default function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left === null) {
    return <div className="h-[72px]" aria-hidden />;
  }

  if (left <= 0) {
    return (
      <p className="text-sm font-medium text-amber-200">
        Ovoz berish yakunlandi
      </p>
    );
  }

  const { d, h, m, s } = parts(left);
  const cells: [number, string][] = [
    [d, "kun"],
    [h, "soat"],
    [m, "daqiqa"],
    [s, "soniya"],
  ];

  return (
    <div className="flex gap-2">
      {cells.map(([v, label]) => (
        <div
          key={label}
          className="card flex min-w-[64px] flex-col items-center rounded-xl px-2 py-2"
        >
          <span className="text-xl font-bold tabular-nums text-white">
            {String(v).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-white/45">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
