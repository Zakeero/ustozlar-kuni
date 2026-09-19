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

export default function Countdown({
  endsAt,
  onBrand = false,
}: {
  endsAt: string;
  /** To'q brend fonida turganda oq uslub */
  onBrand?: boolean;
}) {
  const target = new Date(endsAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (left === null) return <div className="h-[74px]" aria-hidden />;

  if (left <= 0) {
    return (
      <p
        className={
          onBrand ? "font-semibold text-white" : "font-semibold text-[color:var(--brand-700)]"
        }
      >
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

  const cell = onBrand
    ? "bg-white/14 ring-1 ring-white/25 text-white"
    : "bg-white ring-1 ring-[color:var(--line)] text-[color:var(--ember)] shadow-sm";
  const label = onBrand ? "text-white/60" : "text-[color:var(--muted)]";

  return (
    <div className="flex gap-2">
      {cells.map(([v, name]) => (
        <div
          key={name}
          className={`flex min-w-[66px] flex-col items-center rounded-2xl px-2 py-2.5 backdrop-blur-sm ${cell}`}
        >
          <span className="font-display text-[1.45rem] leading-none tabular-nums">
            {String(v).padStart(2, "0")}
          </span>
          <span
            className={`mt-1 text-[0.6rem] font-bold uppercase tracking-wider ${label}`}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}
