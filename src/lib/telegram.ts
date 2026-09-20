import { randomBytes } from "crypto";
import { sql } from "./db";

export const BOT_TOKEN = process.env.BOT_TOKEN ?? "";
export const CHANNEL_ID = process.env.CHANNEL_ID ?? "";
export const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");

/** Kanalga obunani tekshirish */
export async function isSubscribed(telegramId: number): Promise<boolean> {
  if (!CHANNEL_ID) return true; // kanal sozlanmagan — tekshiruv o'chiq
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember` +
        `?chat_id=${encodeURIComponent(CHANNEL_ID)}&user_id=${telegramId}`,
    );
    const data = (await res.json()) as {
      ok: boolean;
      result?: { status: string };
    };
    if (!data.ok || !data.result) return false;
    return ["creator", "administrator", "member"].includes(data.result.status);
  } catch {
    return false;
  }
}

/** Saytga kirish uchun bir martalik token yaratish */
export async function createAuthToken(userId: number): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await sql`INSERT INTO auth_tokens (token, user_id) VALUES (${token}, ${userId})`;
  return token;
}

/** Tokenni ishlatish — faqat bir marta va 1 soat ichida */
export async function consumeAuthToken(token: string): Promise<number | null> {
  const rows = (await sql`
    UPDATE auth_tokens SET used_at = now()
    WHERE token = ${token}
      AND used_at IS NULL
      AND created_at > now() - interval '60 minutes'
    RETURNING user_id
  `) as { user_id: number }[];
  return rows[0]?.user_id ?? null;
}

export function loginUrl(token: string): string {
  return `${APP_URL}/auth/callback?token=${token}`;
}

export function referralLink(userId: number, botUsername: string): string {
  return `https://t.me/${botUsername}?start=ref_${userId}`;
}
