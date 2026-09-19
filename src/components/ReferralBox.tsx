"use client";

import { useState } from "react";

export default function ReferralBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const shareText = encodeURIComponent(
    "Ustozimga ovoz berdim! Sen ham o'z ustozingga rahmat ayt 👇",
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--line)] bg-white p-2">
        <code className="muted min-w-0 flex-1 truncate px-2 text-xs">{link}</code>
        <button
          onClick={copy}
          className="shrink-0 rounded-xl bg-[color:var(--sand)] px-3 py-2 text-xs font-bold text-[color:var(--brand-700)] transition hover:bg-[color:var(--brand-100)]"
        >
          {copied ? "Nusxalandi ✓" : "Nusxalash"}
        </button>
      </div>

      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${shareText}`}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary w-full"
      >
        Telegramda ulashish
      </a>
    </div>
  );
}
