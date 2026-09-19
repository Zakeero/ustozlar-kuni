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
      <BackLink href="/filiallar" label="Filiallar" />
      <PageTitle
        title="Mening sahifam"
        subtitle={`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()}
      />

      <section className="card mb-6 rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="gold">Qolgan ovozlar: {budget.totalLeft}</Badge>
          <Badge>
            Asosiy: {budget.mainUsed}/{budget.mainUsed + budget.mainLeft}
          </Badge>
          <Badge tone="green">
            Bonus: {budget.bonusUsed}/{budget.bonusEarned}
          </Badge>
        </div>
      </section>

      <section className="card mb-6 rounded-2xl p-5">
        <h2 className="font-semibold text-white">Do'stlarni taklif qiling</h2>
        <p className="mt-1 text-sm text-white/55">
          Havolangiz orqali kelgan har bir do'st ovoz berganda sizga{" "}
          <b className="text-white">+1 ovoz</b> qo'shiladi. Ko'pi bilan{" "}
          {MAX_BONUS_VOTES} ta.
        </p>

        <div className="mt-4 flex items-center gap-3 text-sm">
          <div className="flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="tabular-nums text-white/60">
            {budget.referralsCounted}/{MAX_BONUS_VOTES}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-white/35">
          Taklif qilinganlar: {budget.referralsTotal} · ovoz berganlar:{" "}
          {budget.referralsCounted}
        </p>

        <div className="mt-4">
          <ReferralBox link={link} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-white">Mening ovozlarim</h2>
        {votes.length === 0 ? (
          <div className="card rounded-2xl p-6 text-center">
            <p className="text-sm text-white/50">Siz hali ovoz bermagansiz.</p>
            <Link
              href="/filiallar"
              className="mt-3 inline-block rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black"
            >
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
                <div key={v.id} className="card flex items-center gap-3 rounded-2xl p-3.5">
                  <Avatar name={t?.full_name ?? "?"} src={t?.photo_url} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {t?.full_name ?? "Ustoz"}
                    </p>
                    <p className="truncate text-xs text-white/45">
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
