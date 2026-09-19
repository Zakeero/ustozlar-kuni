import Link from "next/link";
import { RESULTS_AT, SITE, votingOpen, resultsPublished } from "@/lib/config";
import Countdown from "@/components/Countdown";

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  const open = votingOpen();
  const published = resultsPublished();

  if (open) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="text-5xl">🗳</p>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Ovoz berish davom etmoqda
        </h1>
        <p className="mt-2 max-w-sm text-sm text-white/55">
          Natijalar ovoz berish yakunlangach e'lon qilinadi. Hozircha reyting
          yopiq — bu tanlovni adolatli saqlaydi.
        </p>
        <Link
          href="/filiallar"
          className="mt-6 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-black"
        >
          Ovoz berish
        </Link>
      </main>
    );
  }

  if (!published) {
    return (
      <main className="flex min-h-[80vh] flex-col items-center justify-center text-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-amber-400/20 pulse-ring" />
          <span
            className="absolute inset-0 rounded-full bg-amber-400/15 pulse-ring"
            style={{ animationDelay: "0.7s" }}
          />
          <span className="spin-slow text-6xl">🏆</span>
        </div>

        <h1 className="mt-8 text-2xl font-bold text-white sm:text-3xl">
          G'oliblar aniqlanmoqda…
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
          Ovoz berish yakunlandi. Hakamlar ovozlarni tekshirmoqda — g'oliblar
          bugun kanalimizda e'lon qilinadi.
        </p>

        <div className="mt-8">
          <Countdown endsAt={RESULTS_AT.toISOString()} />
        </div>

        <a
          href={`https://t.me/${SITE.channel}`}
          className="mt-8 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Kanalda kuzatib borish
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-5xl">🏆</p>
      <h1 className="mt-4 text-2xl font-bold text-white">G'oliblar e'lon qilindi</h1>
      <p className="mt-2 max-w-sm text-sm text-white/55">
        Barcha nominatsiyalar bo'yicha g'oliblar kanalimizda e'lon qilindi.
      </p>
      <a
        href={`https://t.me/${SITE.channel}`}
        className="mt-6 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-black"
      >
        Kanalga o'tish
      </a>
    </main>
  );
}
