"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

type Phase = "idle" | "working" | "failed";

/**
 * Sayt Telegram ichida (Mini App) ochilganda foydalanuvchini avtomatik tanib oladi.
 * Cookie almashinuvi kerak emas — Telegram imzolagan initData yetarli.
 * Oddiy brauzerda hech narsa qilmaydi.
 */
export default function TelegramAutoLogin({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const tried = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (loggedIn || tried.current) return;

    // telegram-web-app.js async yuklanadi — bir necha marta tekshiramiz
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const wa = window.Telegram?.WebApp;
      const initData = wa?.initData;

      if (wa && initData) {
        clearInterval(timer);
        tried.current = true;
        setPhase("working");
        wa.ready?.();
        wa.expand?.();

        fetch("/api/tg-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.ok) {
              router.replace("/filiallar");
              router.refresh();
            } else {
              setPhase("failed");
            }
          })
          .catch(() => setPhase("failed"));
        return;
      }

      // 3 soniyadan keyin — demak oddiy brauzer, aralashmaymiz
      if (attempts > 15) clearInterval(timer);
    }, 200);

    return () => clearInterval(timer);
  }, [loggedIn, router]);

  if (phase === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 px-8 text-center"
      style={{ background: "var(--cream)" }}
    >
      {phase === "working" ? (
        <>
          <span className="spin-slow text-4xl">🗳</span>
          <p className="font-display text-lg text-[color:var(--ember)]">
            Kirilmoqda…
          </p>
        </>
      ) : (
        <>
          <span className="text-4xl">⚠️</span>
          <p className="font-display text-lg text-[color:var(--ember)]">
            Kirib bo'lmadi
          </p>
          <p className="muted max-w-xs text-sm leading-relaxed">
            Panelni yopib, botga <b>/ovoz</b> yuboring va tugmani qayta bosing.
          </p>
        </>
      )}
    </div>
  );
}
