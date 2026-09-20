import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { upsertUser } from "@/lib/db";
import {
  buildSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Telegram Mini App autentifikatsiyasi.
 * Telegram ichida ochilganda sayt initData oladi — uni bot tokeni bilan
 * tekshirib, foydalanuvchini darhol tanib olamiz. Botga qaytish kerak emas.
 *
 * Telefon raqami va kanalga obuna baribir botda tekshiriladi —
 * ovoz berish shu ikkisisiz baribir o'tmaydi.
 */

interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

function verify(initData: string, botToken: string): TgUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computed !== hash) return null;

  // Eski ma'lumot qabul qilinmaydi (24 soat)
  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  try {
    const user = JSON.parse(params.get("user") ?? "null") as TgUser | null;
    return user && typeof user.id === "number" ? user : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let initData = "";
  try {
    const body = (await req.json()) as { initData?: string };
    initData = body.initData ?? "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!initData) return NextResponse.json({ ok: false }, { status: 400 });

  const tgUser = verify(initData, botToken);
  if (!tgUser) return NextResponse.json({ ok: false }, { status: 401 });

  const user = await upsertUser({
    telegramId: tgUser.id,
    firstName: tgUser.first_name ?? null,
    lastName: tgUser.last_name ?? null,
    username: tgUser.username ?? null,
  });

  const value = await buildSessionCookie(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, value, SESSION_COOKIE_OPTIONS);
  return res;
}
