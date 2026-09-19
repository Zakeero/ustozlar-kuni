import Link from "next/link";
import { RESULTS_AT, SITE, votingOpen, resultsPublished } from "@/lib/config";
import Countdown from "@/components/Countdown";

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  const open = votingOpen();
  const published = resultsPublished();

  if (open) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-5xl">🗳</p>
        <h1 className="font-display mt-4 text-2xl text-[color:var(--ember)]">
          Ovoz berish davom etmoqda
        </h1>
        <p className="muted mt-2.5 max-w-sm text-sm leading-relaxed">
          Natijalar ovoz berish yakunlangach e'lon qilinadi. Hozircha reyting
          yopiq — bu tanlovni adolatli saqlaydi.
        </p>
        <Link href="/filiallar" className="btn btn-primary mt-6">
          Ovoz berish
        </Link>
      </main>
    );
  }

  if (!published) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <span
            className="pulse-ring absolute inset-0 rounded-full"
            style={{ background: "rgba(239,81,35,.22)" }}
          />
          <span
            className="pulse-ring absolute inset-0 rounded-full"
            style={{ background: "rgba(232,163,61,.22)", animationDelay: "0.8s" }}
          />
          <span className="spin-slow text-6xl">🏆</span>
        </div>

        <h1 className="font-display mt-8 text-[1.75rem] text-[color:var(--ember)] sm:text-4xl">
          G'oliblar aniqlanmoqda…
        </h1>
        <p className="muted mt-3 max-w-sm text-sm leading-relaxed">
          Ovoz berish yakunlandi. Hakamlar ovozlarni tekshirmoqda — g'oliblar
          bugun kanalimizda e'lon qilinadi.
        </p>

        <div className="mt-8">
          <Countdown endsAt={RESULTS_AT.toISOString()} />
        </div>

        <a href={`https://t.me/${SITE.channel}`} className="btn btn-primary mt-8">
          Kanalda kuzatib borish
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl">🏆</p>
      <h1 className="font-display mt-4 text-2xl text-[color:var(--ember)]">
        G'oliblar e'lon qilindi
      </h1>
      <p className="muted mt-2.5 max-w-sm text-sm">
        Barcha nominatsiyalar bo'yicha g'oliblar kanalimizda e'lon qilindi.
      </p>
      <a href={`https://t.me/${SITE.channel}`} className="btn btn-primary mt-6">
        Kanalga o'tish
      </a>
    </main>
  );
}
