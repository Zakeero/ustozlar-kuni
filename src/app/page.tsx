import Link from "next/link";
import Countdown from "@/components/Countdown";
import { NOMINATIONS, SITE, VOTING_ENDS_AT, MAIN_VOTES, votingOpen } from "@/lib/config";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const user = await getCurrentUser();
  const open = votingOpen();

  const errorText =
    e === "expired"
      ? "Havola muddati tugagan. Botga qaytib /ovoz buyrug'ini yuboring."
      : e === "notoken"
        ? "Havola noto'g'ri. Botdagi tugma orqali kiring."
        : null;

  return (
    <main>
      {errorText && (
        <div className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {errorText}
        </div>
      )}

      <section className="animate-in card mt-6 rounded-3xl p-6 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
          1-oktyabr · Ustozlar va murabbiylar kuni
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          Yilning eng yaxshi ustozi
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
          {SITE.org} ustozlariga minnatdorchilik bildiring. Sizda{" "}
          <span className="font-semibold text-white">{MAIN_VOTES} ta ovoz</span> bor —
          har birini boshqa ustozga berasiz.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          {open ? (
            <>
              <p className="text-xs uppercase tracking-wider text-white/40">
                Ovoz berish yakunlanishiga
              </p>
              <Countdown endsAt={VOTING_ENDS_AT.toISOString()} />
            </>
          ) : (
            <p className="text-sm text-amber-200">Ovoz berish yakunlandi</p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {!open ? (
            <Link
              href="/natijalar"
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Natijalarni ko'rish
            </Link>
          ) : user ? (
            <Link
              href="/filiallar"
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Ovoz berishni boshlash
            </Link>
          ) : (
            <a
              href={`https://t.me/${SITE.botUsername}?start=web`}
              className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Telegram orqali kirish
            </a>
          )}
          <Link
            href="/qoidalar"
            className="rounded-xl border border-white/12 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
          >
            Qoidalar
          </Link>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Nominatsiyalar</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {NOMINATIONS.map((n, i) => (
            <div
              key={n.key}
              className="card animate-in rounded-2xl p-4"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${n.accent} text-xl`}
                >
                  {n.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{n.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                    {n.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-white/35">
        Har bir nominatsiya bo'yicha g'olib <b>har filialda alohida</b> aniqlanadi.
      </p>
    </main>
  );
}
