import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { sql, rows as q } from "@/lib/db";
import { Badge } from "@/components/ui";
import { invalidateReferralTree, toggleUserBlock } from "../actions";

export const dynamic = "force-dynamic";

interface Tree {
  inviter_id: number;
  inviter_name: string | null;
  username: string | null;
  invited: number;
  voted: number;
  top_teacher: string | null;
  top_share: number;
  is_blocked: boolean;
}

interface IpGroup {
  ip_hash: string;
  users: number;
  votes: number;
}

interface Fast {
  id: number;
  first_name: string | null;
  username: string | null;
  seconds: number;
  is_blocked: boolean;
}

export default async function SuspiciousPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [trees, ips, fast] = await Promise.all([
    // Katta referal daraxtlari va ularning bitta ustozga jamlanishi
    q<Tree>(sql`
      WITH tree AS (
        SELECT r.inviter_id, r.invited_id
        FROM referrals r WHERE r.counted
      ),
      votes_in_tree AS (
        SELECT t.inviter_id, v.teacher_id, COUNT(*)::int AS n
        FROM tree t JOIN votes v ON v.user_id = t.invited_id AND v.is_valid
        GROUP BY t.inviter_id, v.teacher_id
      ),
      top AS (
        SELECT DISTINCT ON (inviter_id) inviter_id, teacher_id, n
        FROM votes_in_tree ORDER BY inviter_id, n DESC
      )
      SELECT u.id AS inviter_id,
             u.first_name AS inviter_name,
             u.username,
             u.is_blocked,
             (SELECT COUNT(*)::int FROM referrals r WHERE r.inviter_id = u.id) AS invited,
             (SELECT COUNT(*)::int FROM referrals r WHERE r.inviter_id = u.id AND r.counted) AS voted,
             te.full_name AS top_teacher,
             COALESCE(top.n, 0) AS top_share
      FROM users u
      LEFT JOIN top ON top.inviter_id = u.id
      LEFT JOIN teachers te ON te.id = top.teacher_id
      WHERE (SELECT COUNT(*) FROM referrals r WHERE r.inviter_id = u.id AND r.counted) >= 3
      ORDER BY voted DESC
      LIMIT 50
    `),

    // Bir IP dan ko'p akkaunt
    q<IpGroup>(sql`
      SELECT v.ip_hash, COUNT(DISTINCT v.user_id)::int AS users, COUNT(*)::int AS votes
      FROM votes v WHERE v.ip_hash IS NOT NULL
      GROUP BY v.ip_hash HAVING COUNT(DISTINCT v.user_id) >= 4
      ORDER BY users DESC LIMIT 30
    `),

    // Ro'yxatdan o'tgach 60 soniya ichida ovoz bergan akkauntlar
    q<Fast>(sql`
      SELECT u.id, u.first_name, u.username, u.is_blocked,
             EXTRACT(EPOCH FROM (MIN(v.created_at) - u.created_at))::int AS seconds
      FROM users u JOIN votes v ON v.user_id = u.id
      GROUP BY u.id
      HAVING EXTRACT(EPOCH FROM (MIN(v.created_at) - u.created_at)) < 60
      ORDER BY seconds ASC LIMIT 50
    `),
  ]);

  return (
    <main>
      <h1 className="mb-2 text-2xl font-bold text-white">Shubhali faollik</h1>
      <p className="mb-6 text-sm text-white/50">
        Bu yerdagi ma'lumot avtomatik belgilar — aybdorlik isboti emas. Ovozlarni
        bekor qilishdan oldin tekshiring.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-white">Yirik referal daraxtlari</h2>
        {trees.length === 0 ? (
          <p className="card rounded-2xl p-5 text-sm text-white/40">
            Hozircha shubhali daraxt yo'q.
          </p>
        ) : (
          <div className="grid gap-2.5">
            {trees.map((t) => {
              const concentration = t.voted ? t.top_share / t.voted : 0;
              const risky = concentration > 0.8 && t.voted >= 5;
              return (
                <div key={t.inviter_id} className="card rounded-2xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      {t.inviter_name ?? "—"}{" "}
                      {t.username && (
                        <span className="text-white/35">@{t.username}</span>
                      )}
                    </p>
                    {risky && <Badge tone="red">jamlangan</Badge>}
                    {t.is_blocked && <Badge tone="red">bloklangan</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-white/45">
                    Taklif: {t.invited} · ovoz bergan: {t.voted}
                    {t.top_teacher && (
                      <>
                        {" "}
                        · ko'pi «{t.top_teacher}» ga ({t.top_share} ta,{" "}
                        {Math.round(concentration * 100)}%)
                      </>
                    )}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <form action={toggleUserBlock}>
                      <input type="hidden" name="id" value={t.inviter_id} />
                      <button className="rounded-lg bg-white/8 px-3 py-1.5 text-xs text-white hover:bg-white/12">
                        {t.is_blocked ? "Blokdan chiqarish" : "Bloklash"}
                      </button>
                    </form>
                    <form action={invalidateReferralTree}>
                      <input type="hidden" name="inviter_id" value={t.inviter_id} />
                      <button className="rounded-lg px-3 py-1.5 text-xs text-rose-300/70 hover:bg-rose-400/10 hover:text-rose-200">
                        Daraxt ovozlarini bekor qilish
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-white">Bitta tarmoqdan ko'p akkaunt</h2>
        {ips.length === 0 ? (
          <p className="card rounded-2xl p-5 text-sm text-white/40">Belgi yo'q.</p>
        ) : (
          <div className="grid gap-2">
            {ips.map((g) => (
              <div
                key={g.ip_hash}
                className="card flex items-center justify-between rounded-xl p-3 text-sm"
              >
                <code className="text-xs text-white/40">
                  {g.ip_hash.slice(0, 12)}…
                </code>
                <span className="text-white/70">
                  {g.users} ta akkaunt · {g.votes} ovoz
                </span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-white/30">
          Eslatma: bitta maktab yoki filial Wi-Fi'si ham shunday ko'rinadi.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-white">Juda tez ovoz berganlar</h2>
        {fast.length === 0 ? (
          <p className="card rounded-2xl p-5 text-sm text-white/40">Belgi yo'q.</p>
        ) : (
          <div className="grid gap-2">
            {fast.map((u) => (
              <div
                key={u.id}
                className="card flex items-center justify-between rounded-xl p-3 text-sm"
              >
                <span className="text-white/70">
                  {u.first_name ?? "—"}{" "}
                  {u.username && <span className="text-white/35">@{u.username}</span>}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-white/45">{u.seconds}s</span>
                  <form action={toggleUserBlock}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="rounded-lg bg-white/8 px-2.5 py-1 text-xs text-white hover:bg-white/12">
                      {u.is_blocked ? "Blokdan" : "Blok"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
