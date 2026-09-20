"use client";

import { useEffect, useRef } from "react";
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

/**
 * Sayt Telegram ichida (Mini App) ochilganda foydalanuvchini avtomatik tanib oladi.
 * Oddiy brauzerda hech narsa qilmaydi.
 */
export default function TelegramAutoLogin({
  loggedIn,
}: {
  loggedIn: boolean;
}) {
  const router = useRouter();
  const tried = useRef(false);

  useEffect(() => {
    if (loggedIn || tried.current) return;

    const wa = window.Telegram?.WebApp;
    const initData = wa?.initData;
    if (!wa || !initData) return;

    tried.current = true;
    wa.ready?.();
    wa.expand?.();

    fetch("/api/tg-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) router.replace("/filiallar");
      })
      .catch(() => {
        /* jim qoladi — odatdagi yo'l baribir ishlaydi */
      });
  }, [loggedIn, router]);

  return null;
}
