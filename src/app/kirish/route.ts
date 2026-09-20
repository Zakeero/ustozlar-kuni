import { NextResponse } from "next/server";
import {
  readSessionValue,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Botdagi tugma shu manzilga ochiladi va o'zi bilan sessiya kalitini olib keladi.
 * Kalit bir martalik emas — tugmani necha marta bossa ham ishlayveradi.
 * Bazaga murojaat yo'q, shuning uchun tez va ishonchli.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const s = url.searchParams.get("s");
  if (!s) {
    return NextResponse.redirect(new URL("/?e=notoken", url.origin));
  }

  const userId = await readSessionValue(s);
  if (!userId) {
    return NextResponse.redirect(new URL("/?e=expired", url.origin));
  }

  const res = NextResponse.redirect(new URL("/filiallar?fresh=1", url.origin));
  res.cookies.set(SESSION_COOKIE_NAME, s, SESSION_COOKIE_OPTIONS);
  return res;
}
