import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Statistika" },
  { href: "/admin/ustozlar", label: "Ustozlar" },
  { href: "/admin/filiallar", label: "Filiallar" },
  { href: "/admin/shubhali", label: "Shubhali" },
  { href: "/admin/soz", label: "Iliq so'zlar" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}

async function Shell({ children }: { children: React.ReactNode }) {
  const ok = await isAdmin();

  // Login sahifasi layout ichida, lekin tekshiruvsiz ochilishi kerak.
  if (!ok) {
    return <>{children}</>;
  }

  return (
    <div>
      <nav className="card mb-6 flex flex-wrap gap-1 rounded-2xl p-1.5">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-xl px-3 py-2 text-sm text-white/65 transition hover:bg-white/8 hover:text-white"
          >
            {n.label}
          </Link>
        ))}
        <form action={logout} className="ml-auto">
          <button className="rounded-xl px-3 py-2 text-sm text-white/40 transition hover:text-rose-300">
            Chiqish
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}

async function logout() {
  "use server";
  const { destroyAdminSession } = await import("@/lib/session");
  await destroyAdminSession();
  redirect("/admin/login");
}
