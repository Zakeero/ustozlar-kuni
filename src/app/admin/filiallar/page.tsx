import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";
import { getBranches, sql } from "@/lib/db";
import { createBranch, deleteBranch } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminBranches() {
  if (!(await isAdmin())) redirect("/admin/login");

  const branches = await getBranches();
  const counts = (await sql`
    SELECT branch_id, COUNT(*)::int AS n FROM teachers GROUP BY branch_id
  `) as { branch_id: number; n: number }[];
  const map = new Map(counts.map((c) => [c.branch_id, c.n]));

  return (
    <main>
      <h1 className="mb-5 font-display text-2xl text-[color:var(--ember)]">Filiallar</h1>

      <form action={createBranch} className="card mb-6 grid gap-3 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="name"
            placeholder="Filial nomi"
            required
            className="input"
          />
          <input
            name="slug"
            placeholder="slug (pavarot)"
            required
            className="input"
          />
          <input
            name="address"
            placeholder="Manzil (ixtiyoriy)"
            className="input"
          />
        </div>
        <button className="btn btn-primary justify-self-start">
          Qo'shish
        </button>
      </form>

      <div className="grid gap-2.5">
        {branches.map((b) => (
          <div key={b.id} className="card flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[color:var(--ink)]">{b.name}</p>
              <p className="muted text-xs">
                /{b.slug} · {map.get(b.id) ?? 0} ta ustoz
                {b.address ? ` · ${b.address}` : ""}
              </p>
            </div>
            <form action={deleteBranch}>
              <input type="hidden" name="id" value={b.id} />
              <button className="rounded-lg px-3 py-1.5 text-xs text-[#C02840] hover:bg-[#C02840]/8">
                O'chirish
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
