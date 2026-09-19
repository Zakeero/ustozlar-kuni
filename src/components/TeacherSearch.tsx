"use client";

import { useMemo, useState, Children, isValidElement } from "react";

/**
 * Ustozlar ro'yxati ustidan qidiruv.
 * Har bir bola elementda data-name atributi bo'lishi kerak.
 */
export default function TeacherSearch({
  children,
}: {
  children: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  const items = useMemo(() => Children.toArray(children), [children]);

  const filtered = needle
    ? items.filter((child) => {
        if (!isValidElement(child)) return true;
        const props = child.props as { "data-name"?: string };
        return (props["data-name"] ?? "").includes(needle);
      })
    : items;

  return (
    <>
      <div className="relative mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ustoz ismini yozing…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-amber-400/40 focus:bg-white/8"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            aria-label="Tozalash"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid gap-2.5">{filtered}</div>

      {needle && filtered.length === 0 && (
        <p className="card mt-3 rounded-2xl p-6 text-center text-sm text-white/50">
          “{q}” bo'yicha ustoz topilmadi.
        </p>
      )}
    </>
  );
}
