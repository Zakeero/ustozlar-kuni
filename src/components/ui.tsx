import Link from "next/link";

export function Avatar({
  name,
  src,
  size = 64,
}: {
  name: string;
  src?: string | null;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-2xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-sky-500/20 font-semibold text-amber-100 ring-1 ring-white/10"
      style={{ width: size, height: size, fontSize: size / 2.8 }}
    >
      {initials || "?"}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:text-white"
    >
      <span aria-hidden>←</span> {label}
    </Link>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="animate-in mb-6 mt-4">
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h1>
      {subtitle && <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>}
    </header>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "green" | "red";
}) {
  const tones = {
    default: "bg-white/8 text-white/70 ring-white/10",
    gold: "bg-amber-400/12 text-amber-200 ring-amber-400/25",
    green: "bg-emerald-400/12 text-emerald-200 ring-emerald-400/25",
    red: "bg-rose-400/12 text-rose-200 ring-rose-400/25",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
