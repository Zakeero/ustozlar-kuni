import { notFound, redirect } from "next/navigation";
import { getTeacher, sql, rows as q, type Branch } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getVoteBudget } from "@/lib/votes";
import { Avatar, BackLink } from "@/components/ui";
import VoteForm from "@/components/VoteForm";
import { votingOpen } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function TeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!votingOpen()) redirect("/natijalar");

  const { id } = await params;
  const teacherId = Number(id);
  if (!Number.isFinite(teacherId)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/?e=notoken");

  const teacher = await getTeacher(teacherId);
  if (!teacher || !teacher.is_active) notFound();

  const [branchRows, budget] = await Promise.all([
    q<Branch>(
      sql`SELECT id, slug, name, address, sort_order FROM branches WHERE id = ${teacher.branch_id}`,
    ),
    getVoteBudget(user.id),
  ]);
  const branch = branchRows[0];

  return (
    <main>
      <BackLink href={`/filial/${branch?.slug ?? ""}`} label={branch?.name ?? "Orqaga"} />

      <section className="card animate-in relative mt-4 overflow-hidden p-6 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24"
          style={{
            background:
              "linear-gradient(180deg, rgba(239,81,35,.10), transparent)",
          }}
        />
        <div className="relative mx-auto w-fit">
          <Avatar name={teacher.full_name} src={teacher.photo_url} size={100} />
        </div>
        <h1 className="font-display relative mt-4 text-2xl text-[color:var(--ember)]">
          {teacher.full_name}
        </h1>
        {teacher.subject && (
          <p className="relative mt-1.5 text-sm font-bold text-[color:var(--brand)]">
            {teacher.subject}
          </p>
        )}
        {teacher.bio && (
          <p className="muted relative mx-auto mt-3 max-w-md text-sm leading-relaxed">
            {teacher.bio}
          </p>
        )}
        <p className="muted relative mt-3 text-xs">{branch?.name}</p>
      </section>

      <section className="mt-6">
        <VoteForm
          teacherId={teacher.id}
          teacherName={teacher.full_name}
          branchId={teacher.branch_id}
          askStudent={user.is_student === null}
          votesLeft={budget.totalLeft}
          alreadyVoted={budget.votedTeacherIds.includes(teacher.id)}
        />
      </section>
    </main>
  );
}
