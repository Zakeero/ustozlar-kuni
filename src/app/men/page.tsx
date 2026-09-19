import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getVoteBudget } from "@/lib/votes";
import { getUserVotes, sql } from "@/lib/db";
import { MAX_BONUS_VOTES, NOMINATION_MAP, SITE, isNominationKey } from "@/lib/config";
import { Avatar, BackLink, PageTitle, Badge } from "@/components/ui";
import ReferralBox from "@/components/ReferralBox";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/?e=notoken");

  const [budget, votes] = await Promise.all([
    getVoteBudget(user.id),
    getUserVotes(user.id),
  ]);

  const teacherIds = votes.map((v) => v.teacher_id);
  const teachers = teacherIds.length
    ? ((await sql`
        SELECT id, full_name, photo_url FROM teachers WHERE id = ANY(${teacherIds})
      `) as { id: number; full_name: string; photo_url: string | null }[])
    : [];
  const tMap = new Map(teachers.map((t) => [t.id, t]));

  const link = `https://t.me/${SITE.botUsername}?start=ref_${user.id}`;
  const progress = Math.min(100, (budget.referralsCounted / MAX_BONUS_VOTES) * 100);

  return (
    <main>
      <div className="pt-4">
        <BackLink href="/filiallar" label="Filiallar" />
      </div>
      <PageTitle
        title="Mening sahifam"
        subtitle={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()}
      />

      <section className="card-brand mb-6 p-6">
        <div className="relative">
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-white/65">
            Qolgan ovozlaringiz
          </p>
          <p className="font-display mt-1 text-5xl leading-none text-white">
            {budget.totalLeft}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-white ring-1 ring-white/20">
              Asosiy: {budget.mainUsed}/{budget.mainUsed + budget.mainLeft}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-white ring-1 ring-white/20">
              Bonus: {budget.bonusUsed}/{budget.bonusEarned}
            </span>
          </div>
        </div>
      </section>

      <section className="card mb-6 p-6">
        <span className="eyebrow">Ko'proq ovoz</span>
        <h2 className="font-display mt-2 text-xl text-[color:var(--ember)]">
          Do'stlarni taklif qiling
        </h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Havolangiz orqali kelgan har bir do'st ovoz berganda sizga{" "}
          <b className="text-[color:var(--brand-700)]">+1 ovoz</b> qo'shiladi.
          Ko'pi bilan {MAX_BONUS_VOTES} ta.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[color:var(--sand)]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg,#EF5123,#E8A33D)",
              }}
            />
          </div>
          <span className="text-sm font-bold tabular-nums text-[color:var(--ember)]">
            {budget.referralsCounted}/{MAX_BONUS_VOTES}
          </span>
        </div>
        <p className="muted mt-2 text-xs">
          Taklif qilinganlar: {budget.referralsTotal} · ovoz berganlar:{" "}
          {budget.referralsCounted}
        </p>

        <div className="mt-5">
          <ReferralBox link={link} />
        </div>
      </section>

      <section>
        <h2 className="font-display rule mb-5 text-xl text-[color:var(--ember)]">
          Mening ovozlarim
        </h2>
        {votes.length === 0 ? (
          <div className="card p-7 text-center">
            <p className="muted text-sm">Siz hali ovoz bermagansiz.</p>
            <Link href="/filiallar" className="btn btn-primary mt-4">
              Ovoz berish
            </Link>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {votes.map((v) => {
              const t = tMap.get(v.teacher_id);
              const nom = isNominationKey(v.nomination)
                ? NOMINATION_MAP[v.nomination]
                : null;
              return (
                <div key={v.id} className="card flex items-center gap-3.5 p-3.5">
                  <Avatar name={t?.full_name ?? "?"} src={t?.photo_url} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[color:var(--ink)]">
                      {t?.full_name ?? "Ustoz"}
                    </p>
                    <p
                      className="truncate text-xs font-semibold"
                      style={{ color: nom?.tint ?? "var(--muted)" }}
                    >
                      {nom ? `${nom.emoji} ${nom.title}` : v.nomination}
                    </p>
                  </div>
                  {v.kind === "bonus" && <Badge tone="green">bonus</Badge>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
