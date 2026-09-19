import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSessionUserId } from "@/lib/session";
import { castVote, VOTE_ERROR_TEXT } from "@/lib/votes";
import { isNominationKey } from "@/lib/config";
import { setUserProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Avval Telegram bot orqali kiring." },
      { status: 401 },
    );
  }

  let body: {
    teacherId?: number;
    nomination?: string;
    comment?: string;
    isStudent?: boolean;
    branchId?: number | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Xato so'rov" }, { status: 400 });
  }

  if (!body.teacherId || !isNominationKey(body.nomination)) {
    return NextResponse.json(
      { ok: false, message: "Nominatsiyani tanlang." },
      { status: 400 },
    );
  }

  if (typeof body.isStudent === "boolean") {
    await setUserProfile(userId, body.isStudent, body.branchId ?? null);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const ipHash = ip
    ? createHash("sha256").update(ip + (process.env.SESSION_SECRET ?? "")).digest("hex")
    : null;

  const res = await castVote({
    userId,
    teacherId: Number(body.teacherId),
    nomination: body.nomination,
    comment: body.comment ?? null,
    ipHash,
  });

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, message: VOTE_ERROR_TEXT[res.error!] ?? "Xatolik" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    kind: res.kind,
    budget: res.budget,
  });
}
