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
          className="input !py-3"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--brand)]"
            aria-label="Tozalash"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid gap-2.5">{filtered}</div>

      {needle && filtered.length === 0 && (
        <p className="card muted mt-3 p-6 text-center text-sm">
          “{q}” bo'yicha ustoz topilmadi.
        </p>
      )}
    </>
  );
}
