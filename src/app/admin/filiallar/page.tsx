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
      <h1 className="mb-5 text-2xl font-bold text-white">Filiallar</h1>

      <form action={createBranch} className="card mb-6 grid gap-3 rounded-2xl p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            name="name"
            placeholder="Filial nomi"
            required
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
          />
          <input
            name="slug"
            placeholder="slug (pavarot)"
            required
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
          />
          <input
            name="address"
            placeholder="Manzil (ixtiyoriy)"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
          />
        </div>
        <button className="justify-self-start rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-sm font-semibold text-black">
          Qo'shish
        </button>
      </form>

      <div className="grid gap-2.5">
        {branches.map((b) => (
          <div key={b.id} className="card flex items-center gap-3 rounded-2xl p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{b.name}</p>
              <p className="text-xs text-white/40">
                /{b.slug} · {map.get(b.id) ?? 0} ta ustoz
                {b.address ? ` · ${b.address}` : ""}
              </p>
            </div>
            <form action={deleteBranch}>
              <input type="hidden" name="id" value={b.id} />
              <button className="rounded-lg px-3 py-1.5 text-xs text-rose-300/70 hover:bg-rose-400/10 hover:text-rose-200">
                O'chirish
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
