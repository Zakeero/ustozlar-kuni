import { NextResponse } from "next/server";
import { consumeAuthToken } from "@/lib/telegram";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?e=notoken", url.origin));
  }

  const userId = await consumeAuthToken(token);
  if (!userId) {
    return NextResponse.redirect(new URL("/?e=expired", url.origin));
  }

  await createSession(userId);
  return NextResponse.redirect(new URL("/filiallar", url.origin));
}
