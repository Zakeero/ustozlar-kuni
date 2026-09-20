import Link from "next/link";
import Countdown from "@/components/Countdown";
import {
  NOMINATIONS,
  SITE,
  VOTING_ENDS_AT,
  MAIN_VOTES,
  MAX_BONUS_VOTES,
  votingOpen,
} from "@/lib/config";
import { getCurrentUser } from "@/lib/session";
import { sql } from "@/lib/db";
import TeacherMarquee from "@/components/TeacherMarquee";
import TelegramAutoLogin from "@/components/TelegramAutoLogin";

export const dynamic = "force-dynamic";

/** Lenta uchun ustozlar. Baza javob bermasa sahifa baribir ochilaveradi. */
async function marqueeTeachers() {
  try {
    return (await sql`
      SELECT id, full_name, photo_url
      FROM teachers
      WHERE is_active AND photo_url IS NOT NULL
      ORDER BY random()
      LIMIT 24
    `) as { id: number; full_name: string; photo_url: string | null }[];
  } catch {
    return [];
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const [user, teachers] = await Promise.all([
    getCurrentUser(),
    marqueeTeachers(),
  ]);
  const open = votingOpen();

  const errorText =
    e === "expired"
      ? "Havola muddati tugagan — u 10 daqiqa amal qiladi. Botga qaytib /ovoz yuboring, yangi havola beradi."
      : e === "cookie"
        ? "Brauzeringiz sessiyani saqlamayapti. Panelni yopib, botdagi «🌐 Brauzerda ochish» tugmasi orqali kiring."
        : e === "session"
        ? "Ovoz berish uchun avval botdan kiring: botga /ovoz yuboring va chiqqan tugmani bosing."
        : e === "notoken"
          ? "Havola to'liq emas. Botdagi tugmani bosib kiring."
          : e === "server"
            ? "Vaqtincha nosozlik. Bir daqiqadan so'ng qayta urinib ko'ring."
            : null;

  const steps = [
    {
      n: "01",
      title: "Botga kiring",
      text: "Telegram bot orqali kirasiz va telefon raqamingizni tasdiqlaysiz.",
    },
    {
      n: "02",
      title: "Ustozni tanlang",
      text: `Filialni oching, ustozingizni toping — sizda ${MAIN_VOTES} ta ovoz bor.`,
    },
    {
      n: "03",
      title: "Iliq so'z yozing",
      text: "Ovoz bilan birga yozgan so'zlaringiz ustozga albom bo'lib topshiriladi.",
    },
  ];

  return (
    <main>
      <TelegramAutoLogin loggedIn={Boolean(user)} />

      {errorText && (
        <div className="mt-5 rounded-2xl border border-[color:var(--brand-300)] bg-[color:var(--sand)] px-4 py-3 text-sm font-medium text-[color:var(--brand-700)]">
          {errorText}
        </div>
      )}

      {/* ---------- Hero ---------- */}
      <section className="card-brand animate-in mt-6 px-6 py-10 text-center sm:px-10 sm:py-14">
        <div className="hero-photo" />
        <div className="relative">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-white/75">
            1-oktyabr · Ustozlar va murabbiylar kuni
          </p>

          <h1 className="font-display mt-4 text-[2.1rem] leading-[1.05] text-white sm:text-[3.25rem]">
            Yilning eng
            <br />
            yaxshi ustozi
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Bir yil davomida sizga bilim bergan insonga rahmat aytishning eng
            qisqa yo'li. Sizda{" "}
            <b className="text-white">{MAIN_VOTES} ta ovoz</b> bor — har birini
            boshqa ustozga berasiz.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            {open ? (
              <>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/60">
                  Ovoz berish yakunlanishiga
                </p>
                <Countdown endsAt={VOTING_ENDS_AT.toISOString()} onBrand />
              </>
            ) : (
              <p className="badge badge-gold !bg-white/15 !text-white !border-white/25">
                Ovoz berish yakunlandi
              </p>
            )}
          </div>

          <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            {!open ? (
              <Link href="/natijalar" className="btn btn-light">
                Natijalarni ko'rish
              </Link>
            ) : user ? (
              <Link href="/filiallar" className="btn btn-light">
                Ovoz berishni boshlash →
              </Link>
            ) : (
              <a
                href={`https://t.me/${SITE.botUsername}?start=web`}
                className="btn btn-light"
              >
                Telegram orqali kirish →
              </a>
            )}
            <Link
              href="/qoidalar"
              className="btn !bg-white/12 !text-white ring-1 ring-white/25 hover:!bg-white/20"
            >
              Qanday ishlaydi
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Ustozlar lentasi ---------- */}
      <TeacherMarquee items={teachers} />

      {/* ---------- Qanday ishlaydi ---------- */}
      <section className="mt-12">
        <h2 className="font-display rule text-xl text-[color:var(--ember)]">
          Uch qadamda
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="card animate-in p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="font-display text-2xl text-[#FFB197]">{s.n}</span>
              <h3 className="mt-1 font-bold text-[color:var(--ink)]">
                {s.title}
              </h3>
              <p className="muted mt-1 text-[0.82rem] leading-relaxed">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Nominatsiyalar ---------- */}
      <section className="mt-12">
        <h2 className="font-display rule text-xl text-[color:var(--ember)]">
          Besh nominatsiya
        </h2>
        <p className="muted mt-3 text-sm">
          Ovoz berayotganda qaysi nominatsiyani tanlashingiz sizga bog'liq — har
          bir reaksiya alohida g'olibni aniqlaydi.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {NOMINATIONS.map((n, i) => (
            <article
              key={n.key}
              className="card card-hover animate-in flex items-start gap-3.5 p-4"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[1.35rem] shadow-sm"
                style={{ background: n.accent }}
              >
                {n.emoji}
              </div>
              <div className="min-w-0">
                <h3
                  className="font-bold leading-tight"
                  style={{ color: n.tint }}
                >
                  {n.title}
                </h3>
                <p className="muted mt-1 text-[0.8rem] leading-relaxed">
                  {n.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Referal ---------- */}
      <section className="card animate-in mt-12 overflow-hidden p-0">
        <div className="grid sm:grid-cols-[1.4fr_1fr]">
          <div className="p-6 sm:p-7">
            <span className="eyebrow">Qo'shimcha ovoz</span>
            <h2 className="font-display mt-2 text-xl text-[color:var(--ember)]">
              Do'stingizni taklif qiling
            </h2>
            <p className="muted mt-2 text-sm leading-relaxed">
              Havolangiz orqali kelgan har bir do'st ovoz berganda sizga{" "}
              <b className="text-[color:var(--brand-700)]">+1 ovoz</b> qo'shiladi
              — ko'pi bilan {MAX_BONUS_VOTES} ta. Ustozingiz uchun kurashing.
            </p>
          </div>
          <div
            className="flex items-center justify-center gap-1 p-6 text-3xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(239,81,35,.10), rgba(232,163,61,.16))",
            }}
          >
            <span>🤝</span>
            <span className="text-[color:var(--brand)]">+1</span>
          </div>
        </div>
      </section>

      <p className="muted mt-10 text-center text-xs">
        Har bir nominatsiya bo'yicha g'olib{" "}
        <b className="text-[color:var(--ember)]">har filialda alohida</b>{" "}
        aniqlanadi — yutqazgan ustoz bo'lmaydi.
      </p>
    </main>
  );
}
