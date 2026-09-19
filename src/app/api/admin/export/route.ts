import { isAdmin } from "@/lib/session";
import { sql } from "@/lib/db";
import { NOMINATION_MAP, isNominationKey } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) lines.push(headers.map((h) => csvCell(r[h])).join(","));
  return "﻿" + lines.join("\n");
}

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return new Response("Ruxsat yo'q", { status: 403 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "scores";

  if (type === "comments") {
    const rows = (await sql`
      SELECT b.name AS filial, t.full_name AS ustoz, v.comment AS soz,
             u.first_name AS muallif,
             to_char(v.created_at AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD HH24:MI') AS vaqt
      FROM votes v
      JOIN teachers t ON t.id = v.teacher_id
      JOIN branches b ON b.id = t.branch_id
      JOIN users u ON u.id = v.user_id
      WHERE v.comment IS NOT NULL AND v.is_valid AND NOT u.is_blocked
      ORDER BY b.name, t.full_name, v.created_at
    `) as Record<string, unknown>[];

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="iliq-sozlar.csv"',
      },
    });
  }

  const raw = (await sql`
    SELECT b.name AS filial, t.full_name AS ustoz, t.subject AS fan,
           v.nomination,
           COUNT(*)::int AS jami,
           COUNT(*) FILTER (WHERE u.is_student)::int AS oquvchi,
           COUNT(*) FILTER (WHERE u.is_student IS NOT TRUE)::int AS mehmon
    FROM votes v
    JOIN teachers t ON t.id = v.teacher_id
    JOIN branches b ON b.id = t.branch_id
    JOIN users u ON u.id = v.user_id
    WHERE v.is_valid AND NOT u.is_blocked
    GROUP BY b.name, t.full_name, t.subject, v.nomination
    ORDER BY b.name, v.nomination, jami DESC
  `) as {
    filial: string;
    ustoz: string;
    fan: string | null;
    nomination: string;
    jami: number;
    oquvchi: number;
    mehmon: number;
  }[];

  const rows = raw.map((r) => ({
    filial: r.filial,
    nominatsiya: isNominationKey(r.nomination)
      ? NOMINATION_MAP[r.nomination].title
      : r.nomination,
    ustoz: r.ustoz,
    fan: r.fan ?? "",
    jami: r.jami,
    oquvchi_ovozi: r.oquvchi,
    mehmon_ovozi: r.mehmon,
  }));

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="natijalar.csv"',
    },
  });
}
