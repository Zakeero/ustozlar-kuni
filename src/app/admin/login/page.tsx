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
      <form action={login} className="card w-full max-w-sm p-6">
        <h1 className="font-display text-lg text-[color:var(--ember)]">Admin panel</h1>
        <p className="mt-1 muted text-sm">Parolni kiriting</p>

        {e && (
          <p className="mt-3 rounded-lg border border-[color:var(--brand-300)] bg-[color:var(--sand)] px-3 py-2 text-sm text-[color:var(--brand-700)]">
            Parol noto'g'ri
          </p>
        )}

        <input
          name="password"
          type="password"
          autoFocus
          className="input mt-4"
        />
        <button className="btn btn-primary mt-3 w-full">
          Kirish
        </button>
      </form>
    </main>
  );
}
