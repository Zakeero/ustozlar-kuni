import Image from "next/image";
import { SITE } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-[color:var(--ember)] text-white/70">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 120% at 50% 0%, rgba(239,81,35,.55), transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-10 text-center">
        <Image
          src="/logo-white.png"
          alt="Registon O'quv Markazi"
          width={1000}
          height={279}
          className="h-7 w-auto opacity-90"
        />
        <p className="max-w-sm text-sm leading-relaxed text-white/65">
          Ustozlarimizga bo'lgan hurmat — bir kunlik bayram emas, butun yil
          davomida davom etadigan minnatdorchilik.
        </p>
        <a
          href={`https://t.me/${SITE.channel}`}
          className="text-sm font-semibold text-[color:var(--brand-300)] hover:text-white"
        >
          @{SITE.channel}
        </a>
        <p className="mt-2 text-xs text-white/35">
          © 2026 {SITE.org}
        </p>
      </div>
    </footer>
  );
}
