import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { sql } from "@/lib/db";
import { hideComment } from "../actions";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  comment: string;
  teacher: string;
  branch: string;
  author: string | null;
  created_at: string;
}

export default async function CommentsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const rows = (await sql`
    SELECT v.id, v.comment, t.full_name AS teacher, b.name AS branch,
           u.first_name AS author, v.created_at
    FROM votes v
    JOIN teachers t ON t.id = v.teacher_id
    JOIN branches b ON b.id = t.branch_id
    JOIN users u ON u.id = v.user_id
    WHERE v.comment IS NOT NULL AND v.is_valid AND NOT u.is_blocked
    ORDER BY t.full_name, v.created_at DESC
  `) as Row[];

  const byTeacher = new Map<string, Row[]>();
  for (const r of rows) {
    const key = `${r.teacher} — ${r.branch}`;
    if (!byTeacher.has(key)) byTeacher.set(key, []);
    byTeacher.get(key)!.push(r);
  }

  return (
    <main>
      <h1 className="mb-2 font-display text-2xl text-[color:var(--ember)]">Iliq so'zlar</h1>
      <p className="mb-6 muted text-sm">
        Jami {rows.length} ta izoh. 1-oktyabrda har bir ustozga o'ziga yozilganlari
        albom qilib topshiriladi.
      </p>

      <a
        href="/api/admin/export?type=comments"
        className="btn btn-ghost mb-6"
      >
        Hammasini CSV qilib yuklab olish
      </a>

      <div className="grid gap-4">
        {[...byTeacher.entries()].map(([key, items]) => (
          <section key={key} className="card p-5">
            <h2 className="mb-3 font-bold text-[color:var(--ember)]">
              {key}{" "}
              <span className="text-sm font-normal muted">
                ({items.length})
              </span>
            </h2>
            <ul className="space-y-2.5">
              {items.map((r) => (
                <li key={r.id} className="rounded-xl bg-[color:var(--sand)]/60 p-3">
                  <p className="text-sm leading-relaxed text-[color:var(--ink)]">
                    “{r.comment}”
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="muted text-xs">
                      {r.author ?? "anonim"}
                    </span>
                    <form action={hideComment}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-xs text-[#C02840]/70 hover:text-[#C02840]">
                        yashirish
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="card p-6 text-center muted text-sm">
          Hali izoh yozilmagan.
        </p>
      )}
    </main>
  );
}
