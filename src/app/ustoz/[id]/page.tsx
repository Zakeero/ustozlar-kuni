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

      <section className="card animate-in mt-4 rounded-3xl p-6 text-center">
        <div className="mx-auto w-fit">
          <Avatar name={teacher.full_name} src={teacher.photo_url} size={96} />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">{teacher.full_name}</h1>
        {teacher.subject && (
          <p className="mt-1 text-sm text-amber-200/80">{teacher.subject}</p>
        )}
        {teacher.bio && (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/55">
            {teacher.bio}
          </p>
        )}
        <p className="mt-3 text-xs text-white/35">{branch?.name}</p>
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
