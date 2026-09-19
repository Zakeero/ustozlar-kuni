import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { sql, rows, getBranches } from "@/lib/db";
import { getScores } from "@/lib/votes";
import { NOMINATIONS, NOMINATION_MAP, isNominationKey } from "@/lib/config";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [stats, branches, scores, hourly] = await Promise.all([
    rows<{
      users: number;
      verified: number;
      votes: number;
      bonus_votes: number;
      referrals: number;
      blocked: number;
      voters: number;
    }>(sql`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM users WHERE phone IS NOT NULL) AS verified,
        (SELECT COUNT(*)::int FROM votes WHERE is_valid) AS votes,
        (SELECT COUNT(*)::int FROM votes WHERE kind='bonus' AND is_valid) AS bonus_votes,
        (SELECT COUNT(*)::int FROM referrals WHERE counted) AS referrals,
        (SELECT COUNT(*)::int FROM users WHERE is_blocked) AS blocked,
        (SELECT COUNT(DISTINCT user_id)::int FROM votes) AS voters
    `),
    getBranches(),
    getScores(),
    rows<{ h: string; n: number }>(sql`
      SELECT date_trunc('hour', created_at) AS h, COUNT(*)::int AS n
      FROM votes WHERE created_at > now() - interval '24 hours'
      GROUP BY 1 ORDER BY 1
    `),
  ]);

  const s = stats[0];
  const maxHour = Math.max(1, ...hourly.map((x) => x.n));

  const cards = [
    { label: "Ro'yxatdan o'tgan", value: s.users },
    { label: "Telefon tasdiqlagan", value: s.verified },
    { label: "Ovoz bergan", value: s.voters },
    { label: "Jami ovozlar", value: s.votes },
    { label: "Bonus ovozlar", value: s.bonus_votes },
    { label: "Ishlagan referal", value: s.referrals },
  ];

  return (
    <main>
      <h1 className="mb-5 font-display text-2xl text-[color:var(--ember)]">Statistika</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="font-display text-2xl tabular-nums text-[color:var(--ember)]">{c.value}</p>
            <p className="mt-0.5 muted text-xs">{c.label}</p>
          </div>
        ))}
      </div>

      {s.blocked > 0 && (
        <div className="mb-6">
          <Badge tone="red">{s.blocked} ta bloklangan akkaunt</Badge>
        </div>
      )}

      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-bold text-[color:var(--ember)]">Oxirgi 24 soat</h2>
        <div className="flex h-24 items-end gap-1">
          {hourly.length === 0 && (
            <p className="muted text-sm">Hali ovoz yo'q</p>
          )}
          {hourly.map((x) => (
            <div
              key={x.h}
              title={`${new Date(x.h).getHours()}:00 — ${x.n} ovoz`}
              className="flex-1 rounded-t bg-[color:var(--brand)]"
              style={{ height: `${(x.n / maxHour) * 100}%`, minHeight: 2 }}
            />
          ))}
        </div>
      </section>

      {branches.map((b) => (
        <section key={b.id} className="mb-6">
          <h2 className="mb-3 font-bold text-[color:var(--ember)]">{b.name}</h2>
          <div className="grid gap-3">
            {NOMINATIONS.map((n) => {
              const rows = scores
                .filter((x) => x.branch_id === b.id && x.nomination === n.key)
                .slice(0, 5);
              return (
                <div key={n.key} className="card p-4">
                  <p className="mb-2 text-sm font-bold text-[color:var(--ember)]">
                    {n.emoji} {n.title}
                  </p>
                  {rows.length === 0 ? (
                    <p className="muted text-xs">Ovoz yo'q</p>
                  ) : (
                    <ol className="space-y-1">
                      {rows.map((r, i) => (
                        <li
                          key={r.teacher_id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[color:var(--ink)]">
                            <span className="mr-2 muted">{i + 1}.</span>
                            {r.full_name}
                          </span>
                          <span className="font-semibold tabular-nums text-[color:var(--brand)]">
                            {r.votes}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/api/admin/export?type=scores"
          className="btn btn-ghost"
        >
          Natijalarni yuklab olish (CSV)
        </Link>
        <Link
          href="/api/admin/export?type=comments"
          className="btn btn-ghost"
        >
          Iliq so'zlar (CSV)
        </Link>
      </div>
      <p className="mt-2 muted text-xs">
        Nominatsiyalar: {Object.keys(NOMINATION_MAP).filter(isNominationKey).length} ta
      </p>
    </main>
  );
}
