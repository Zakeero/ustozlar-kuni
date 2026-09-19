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
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
        <code className="min-w-0 flex-1 truncate px-2 text-xs text-white/70">
          {link}
        </code>
        <button
          onClick={copy}
          className="shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
        >
          {copied ? "Nusxalandi ✓" : "Nusxalash"}
        </button>
      </div>

      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${shareText}`}
        target="_blank"
        rel="noreferrer"
        className="block w-full rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-5 py-3 text-center text-sm font-semibold text-black transition hover:brightness-110"
      >
        Telegramda ulashish
      </a>
    </div>
  );
}
