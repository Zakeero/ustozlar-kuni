import Link from "next/link";
import { redirect } from "next/navigation";
import { getBranches, sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getVoteBudget } from "@/lib/votes";
import { PageTitle, Badge } from "@/components/ui";
import { votingOpen } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  if (!votingOpen()) redirect("/natijalar");

  const user = await getCurrentUser();
  if (!user) redirect("/?e=notoken");

  const branches = await getBranches();
  const budget = await getVoteBudget(user.id);

  const counts = (await sql`
    SELECT branch_id, COUNT(*)::int AS n FROM teachers WHERE is_active GROUP BY branch_id
  `) as { branch_id: number; n: number }[];
  const countMap = new Map(counts.map((c) => [c.branch_id, c.n]));

  return (
    <main>
      <PageTitle
        title="Filialni tanlang"
        subtitle="Ustozingiz qaysi filialda dars beradi?"
      />

      <div className="card mb-6 flex flex-wrap items-center gap-2 rounded-2xl p-4">
        <Badge tone="gold">Qolgan ovozlar: {budget.totalLeft}</Badge>
        <Badge>Asosiy: {budget.mainLeft}</Badge>
        {budget.bonusEarned > 0 && <Badge tone="green">Bonus: {budget.bonusLeft}</Badge>}
        <Link href="/men" className="ml-auto text-xs text-amber-300 hover:underline">
          Mening sahifam →
        </Link>
      </div>

      <div className="grid gap-3">
        {branches.map((b, i) => (
          <Link
            key={b.id}
            href={`/filial/${b.slug}`}
            className="card card-hover animate-in flex items-center justify-between rounded-2xl p-5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div>
              <h2 className="text-lg font-semibold text-white">{b.name}</h2>
              <p className="mt-0.5 text-xs text-white/45">
                {b.address ? `${b.address} · ` : ""}
                {countMap.get(b.id) ?? 0} ta ustoz
              </p>
            </div>
            <span className="text-white/30">→</span>
          </Link>
        ))}
      </div>

      {branches.length === 0 && (
        <p className="card rounded-2xl p-6 text-center text-sm text-white/50">
          Filiallar hali qo'shilmagan.
        </p>
      )}
    </main>
  );
}
