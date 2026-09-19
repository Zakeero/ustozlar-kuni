import Link from "next/link";
import Image from "next/image";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--line)] bg-[color:var(--cream)]/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center" aria-label="Bosh sahifa">
          <Image
            src="/logo.png"
            alt="Registon O'quv Markazi"
            width={1000}
            height={279}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <span className="ml-auto hidden text-xs font-semibold text-[color:var(--muted)] sm:block">
          1-oktyabr · Ustozlar kuni
        </span>

        <Link href="/qoidalar" className="btn btn-ghost !px-3 !py-2 !text-xs">
          Qoidalar
        </Link>
      </div>
    </header>
  );
}
