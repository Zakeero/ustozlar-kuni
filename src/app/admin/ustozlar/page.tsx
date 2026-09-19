import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { getBranches, sql, rows as q } from "@/lib/db";
import { Avatar, Badge } from "@/components/ui";
import {
  bulkCreateTeachers,
  createTeacher,
  toggleTeacher,
  updateTeacher,
} from "../actions";

export const dynamic = "force-dynamic";

interface Row {
  id: number;
  branch_id: number;
  full_name: string;
  subject: string | null;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  votes: number;
}

export default async function AdminTeachers() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [branches, teachers] = await Promise.all([
    getBranches(),
    q<Row>(sql`
      SELECT t.id, t.branch_id, t.full_name, t.subject, t.bio, t.photo_url, t.is_active,
             COUNT(v.id) FILTER (WHERE v.is_valid)::int AS votes
      FROM teachers t
      LEFT JOIN votes v ON v.teacher_id = t.id
      GROUP BY t.id
      ORDER BY t.branch_id, t.sort_order, t.full_name
    `),
  ]);

  const input =
    "input";

  return (
    <main>
      <h1 className="mb-5 font-display text-2xl text-[color:var(--ember)]">Ustozlar</h1>

      <form
        action={bulkCreateTeachers}
        className="card mb-4 grid gap-3 p-5"
      >
        <h2 className="font-bold text-[color:var(--ember)]">Ro'yxat bilan qo'shish</h2>
        <p className="muted text-xs">
          Har qatorda bitta ustoz. Format: <code>Ism Familiya | Fan</code> — fan
          ixtiyoriy. Rasmni keyin alohida yuklaysiz.
        </p>
        <select name="branch_id" required className={input}>
          <option value="">Filialni tanlang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id} className="bg-white">
              {b.name}
            </option>
          ))}
        </select>
        <textarea
          name="lines"
          rows={6}
          placeholder={"Aziza Karimova | Ingliz tili\nBobur Ergashev | Matematika"}
          className={`${input} resize-y font-mono`}
        />
        <button className="btn btn-primary justify-self-start">
          Ro'yxatni qo'shish
        </button>
      </form>

      <form action={createTeacher} className="card mb-6 grid gap-3 p-5">
        <h2 className="font-bold text-[color:var(--ember)]">Bitta ustoz qo'shish</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <select name="branch_id" required className={input}>
            <option value="">Filial</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-white">
                {b.name}
              </option>
            ))}
          </select>
          <input name="full_name" placeholder="Ism Familiya" required className={input} />
          <input name="subject" placeholder="Fan" className={input} />
          <input
            name="photo"
            type="file"
            accept="image/*"
            className="muted text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--sand)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--brand-700)]"
          />
        </div>
        <textarea
          name="bio"
          rows={2}
          placeholder="Qisqa ma'lumot (ixtiyoriy)"
          className={`${input} resize-y`}
        />
        <button className="btn btn-primary justify-self-start">
          Qo'shish
        </button>
      </form>

      {branches.map((b) => {
        const rows = teachers.filter((t) => t.branch_id === b.id);
        return (
          <section key={b.id} className="mb-6">
            <h2 className="mb-3 font-bold text-[color:var(--ember)]">
              {b.name}{" "}
              <span className="text-sm font-normal muted">
                ({rows.length})
              </span>
            </h2>
            <div className="grid gap-2.5">
              {rows.map((t) => (
                <details key={t.id} className="card p-4">
                  <summary className="flex cursor-pointer items-center gap-3">
                    <Avatar name={t.full_name} src={t.photo_url} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[color:var(--ink)]">{t.full_name}</p>
                      <p className="truncate muted text-xs">
                        {t.subject ?? "—"} · {t.votes} ovoz
                      </p>
                    </div>
                    {!t.is_active && <Badge tone="red">yashirilgan</Badge>}
                    {!t.photo_url && <Badge>rasm yo'q</Badge>}
                  </summary>

                  <form
                    action={updateTeacher}
                    className="mt-4 grid gap-3 border-t border-[color:var(--line)] pt-4"
                  >
                    <input type="hidden" name="id" value={t.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        name="full_name"
                        defaultValue={t.full_name}
                        className={input}
                      />
                      <input
                        name="subject"
                        defaultValue={t.subject ?? ""}
                        placeholder="Fan"
                        className={input}
                      />
                    </div>
                    <textarea
                      name="bio"
                      rows={2}
                      defaultValue={t.bio ?? ""}
                      placeholder="Qisqa ma'lumot"
                      className={`${input} resize-y`}
                    />
                    <input
                      name="photo"
                      type="file"
                      accept="image/*"
                      className="muted text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--sand)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--brand-700)]"
                    />
                    <div className="flex gap-2">
                      <button className="btn btn-ghost !py-2.5">
                        Saqlash
                      </button>
                    </div>
                  </form>

                  <form action={toggleTeacher} className="mt-2">
                    <input type="hidden" name="id" value={t.id} />
                    <button className="muted text-xs hover:text-white">
                      {t.is_active ? "Ro'yxatdan yashirish" : "Ro'yxatga qaytarish"}
                    </button>
                  </form>
                </details>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
