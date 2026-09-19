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
        className="rounded-2xl object-cover ring-1 ring-[color:var(--line)]"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-2xl font-extrabold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size / 2.9,
        background: "linear-gradient(140deg, #FF8A5C, #EF5123)",
        boxShadow: "0 8px 18px -10px rgba(239,81,35,.8)",
      }}
    >
      {initials || "?"}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--muted)] transition hover:text-[color:var(--brand)]"
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
      <h1 className="font-display rule text-2xl text-[color:var(--ember)] sm:text-3xl">
        {title}
      </h1>
      {subtitle && <p className="muted mt-3 text-sm">{subtitle}</p>}
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
  const map = {
    default: "badge-muted",
    gold: "badge-gold",
    green: "badge-teal",
    red: "badge-brand",
  } as const;
  return <span className={`badge ${map[tone]}`}>{children}</span>;
}
