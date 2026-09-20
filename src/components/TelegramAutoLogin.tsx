"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SITE } from "@/lib/config";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        platform?: string;
        version?: string;
        initDataUnsafe?: { user?: { id?: number } };
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

type Phase = "idle" | "working" | "failed";

/** Telegram ma'lumotni URL hash orqali uzatadi — zaxira o'qish yo'li */
function initDataFromHash(): string {
  try {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return "";
    return new URLSearchParams(raw).get("tgWebAppData") ?? "";
  } catch {
    return "";
  }
}

function insideTelegram(): boolean {
  const wa = window.Telegram?.WebApp;
  if (!wa) return false;
  const p = wa.platform;
  return Boolean(
    (p && p !== "unknown") || wa.initDataUnsafe?.user?.id || initDataFromHash(),
  );
}

/**
 * Panel Telegram ichida ochilganda foydalanuvchini avtomatik tanib oladi.
 * Asosiy yo'l — botdagi tugmaga kiritilgan kirish kaliti; bu esa zaxira.
 */
export default function TelegramAutoLogin({
  loggedIn,
  errorCode,
}: {
  loggedIn: boolean;
  errorCode?: string;
}) {
  const router = useRouter();
  const tried = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    // e=cookie — kirish o'tgan, lekin sessiya saqlanmagan.
    // Qayta urinish aylanma hosil qiladi, shuning uchun to'xtaymiz.
    if (loggedIn || tried.current || errorCode === "cookie") return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const wa = window.Telegram?.WebApp;
      const initData = wa?.initData || initDataFromHash();

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
              // To'liq sahifa yuklanishi — cookie ishonchliroq qo'llanadi
              window.location.href = "/filiallar?fresh=1";
            } else {
              setPhase("failed");
            }
          })
          .catch(() => setPhase("failed"));
        return;
      }

      // 8 soniya kutamiz — sekin ulanishda skript kech yuklanishi mumkin
      if (attempts > 40) {
        clearInterval(timer);
        // Telegram ichidamiz, lekin ma'lumot kelmadi — jim qolmaymiz
        if (insideTelegram()) {
          tried.current = true;
          setPhase("failed");
        }
      }
    }, 200);

    return () => clearInterval(timer);
  }, [loggedIn, errorCode, router]);

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
          <span className="text-4xl">🔑</span>
          <p className="font-display text-lg text-[color:var(--ember)]">
            Panelni qayta oching
          </p>
          <p className="muted max-w-xs text-sm leading-relaxed">
            Bu panelni yoping, botga <b>/ovoz</b> yuboring va kelgan xabardagi
            <b> 🗳 Ovoz berish</b> tugmasini bosing.
          </p>
          <a
            href={`https://t.me/${SITE.botUsername}?start=ovoz`}
            className="btn btn-primary mt-2"
          >
            Botni ochish
          </a>
        </>
      )}
    </div>
  );
}
