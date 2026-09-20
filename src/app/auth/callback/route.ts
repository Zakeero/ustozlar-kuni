import { NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/telegram";
import {
  buildSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?e=notoken", url.origin));
  }

  let userId: number | null = null;
  try {
    userId = await consumeAuthToken(token);
  } catch (e) {
    console.error("auth callback db error", e);
    return NextResponse.redirect(new URL("/?e=server", url.origin));
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/?e=expired", url.origin));
  }

  const value = await buildSessionCookie(userId);

  // Cookie redirect javobining o'ziga yoziladi — shunda u albatta saqlanadi.
  // fresh=1 — kirish muvaffaqiyatli bo'ldi. Agar keyingi sahifa baribir
  // sessiyani ko'rmasa, demak cookie saqlanmagan: shuni aniq ajratamiz.
  const res = NextResponse.redirect(new URL("/filiallar?fresh=1", url.origin));
  res.cookies.set(SESSION_COOKIE_NAME, value, SESSION_COOKIE_OPTIONS);
  return res;
}
