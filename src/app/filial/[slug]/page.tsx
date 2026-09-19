import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBranchBySlug, getTeachersByBranch } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getVoteBudget } from "@/lib/votes";
import { Avatar, BackLink, PageTitle, Badge } from "@/components/ui";
import { votingOpen } from "@/lib/config";
import TeacherSearch from "@/components/TeacherSearch";

export const dynamic = "force-dynamic";

export default async function BranchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!votingOpen()) redirect("/natijalar");

  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/?e=notoken");

  const branch = await getBranchBySlug(slug);
  if (!branch) notFound();

  const [teachers, budget] = await Promise.all([
    getTeachersByBranch(branch.id),
    getVoteBudget(user.id),
  ]);

  const voted = new Set(budget.votedTeacherIds);

  return (
    <main>
      <BackLink href="/filiallar" label="Filiallar" />
      <PageTitle
        title={branch.name}
        subtitle={`${teachers.length} ta ustoz · qolgan ovozlaringiz: ${budget.totalLeft}`}
      />

      <TeacherSearch>
        {teachers.map((t, i) => (
          <Link
            key={t.id}
            href={`/ustoz/${t.id}`}
            data-name={`${t.full_name} ${t.subject ?? ""}`.toLowerCase()}
            className="card card-hover animate-in flex items-center gap-4 rounded-2xl p-4"
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            <Avatar name={t.full_name} src={t.photo_url} size={56} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-white">{t.full_name}</h3>
              {t.subject && (
                <p className="truncate text-xs text-white/45">{t.subject}</p>
              )}
            </div>
            {voted.has(t.id) ? (
              <Badge tone="green">Ovoz berilgan</Badge>
            ) : (
              <span className="text-white/25">→</span>
            )}
          </Link>
        ))}
      </TeacherSearch>

      {teachers.length === 0 && (
        <p className="card rounded-2xl p-6 text-center text-sm text-white/50">
          Bu filialda ustozlar hali qo'shilmagan.
        </p>
      )}
    </main>
  );
}
