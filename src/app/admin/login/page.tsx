import { redirect } from "next/navigation";
import { createAdminSession, isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD o'rnatilmagan");
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?e=1");
  }
  await createAdminSession();
  redirect("/admin");
}

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;

  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <form action={login} className="card w-full max-w-sm rounded-2xl p-6">
        <h1 className="text-lg font-semibold text-white">Admin panel</h1>
        <p className="mt-1 text-sm text-white/50">Parolni kiriting</p>

        {e && (
          <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            Parol noto'g'ri
          </p>
        )}

        <input
          name="password"
          type="password"
          autoFocus
          className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/40"
        />
        <button className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-black">
          Kirish
        </button>
      </form>
    </main>
  );
}
