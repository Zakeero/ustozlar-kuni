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
      <h1 className="mb-2 text-2xl font-bold text-white">Iliq so'zlar</h1>
      <p className="mb-6 text-sm text-white/50">
        Jami {rows.length} ta izoh. 1-oktyabrda har bir ustozga o'ziga yozilganlari
        albom qilib topshiriladi.
      </p>

      <a
        href="/api/admin/export?type=comments"
        className="mb-6 inline-block rounded-xl border border-white/12 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5"
      >
        Hammasini CSV qilib yuklab olish
      </a>

      <div className="grid gap-4">
        {[...byTeacher.entries()].map(([key, items]) => (
          <section key={key} className="card rounded-2xl p-5">
            <h2 className="mb-3 font-semibold text-white">
              {key}{" "}
              <span className="text-sm font-normal text-white/40">
                ({items.length})
              </span>
            </h2>
            <ul className="space-y-2.5">
              {items.map((r) => (
                <li key={r.id} className="rounded-xl bg-white/4 p-3">
                  <p className="text-sm leading-relaxed text-white/80">
                    “{r.comment}”
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-xs text-white/35">
                      {r.author ?? "anonim"}
                    </span>
                    <form action={hideComment}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-xs text-rose-300/60 hover:text-rose-200">
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
        <p className="card rounded-2xl p-6 text-center text-sm text-white/40">
          Hali izoh yozilmagan.
        </p>
      )}
    </main>
  );
}
