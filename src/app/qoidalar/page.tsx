import { BackLink, PageTitle } from "@/components/ui";
import { MAIN_VOTES, MAX_BONUS_VOTES, NOMINATIONS, VOTING_ENDS_AT } from "@/lib/config";

export const metadata = { title: "Qoidalar" };

const fmt = new Intl.DateTimeFormat("uz-UZ", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tashkent",
});

export default function RulesPage() {
  const rules: { title: string; body: string }[] = [
    {
      title: "Kim ovoz bera oladi",
      body: "Telegram bot orqali ro'yxatdan o'tgan, telefon raqamini tasdiqlagan va kanalga obuna bo'lgan har bir kishi. Ovoz berayotganda o'quvchi yoki mehmon ekaningizni belgilaysiz — bu ikki toifa alohida hisoblanadi.",
    },
    {
      title: "Nechta ovoz bor",
      body: `Har bir kishida ${MAIN_VOTES} ta asosiy ovoz bor va ularning har biri boshqa-boshqa ustozga beriladi. Bitta ustozga ikki marta asosiy ovoz berib bo'lmaydi.`,
    },
    {
      title: "Qo'shimcha ovozlar",
      body: `Sizning havolangiz orqali kelgan do'stingiz ovoz bersa, sizga +1 qo'shimcha ovoz qo'shiladi. Qo'shimcha ovozlar soni ko'pi bilan ${MAX_BONUS_VOTES} ta. Faqat bot ochgani yetarli emas — do'stingiz ovoz berishi shart.`,
    },
    {
      title: "Bir telefon — bir akkaunt",
      body: "Har bir telefon raqami faqat bitta akkauntga biriktiriladi. Bu soxta ovozlarning oldini oladi.",
    },
    {
      title: "Reyting nega yopiq",
      body: "Ovoz berish davomida aniq raqamlar ko'rsatilmaydi. Bu oxirgi kunlardagi sun'iy ovoz to'plashning oldini oladi va tanlovni adolatli saqlaydi.",
    },
    {
      title: "Soxta ovozlar",
      body: "Tizim shubhali ovozlarni avtomatik belgilaydi va ular yakuniy hisobdan chiqariladi. Ustozlar bunda aybdor emas — hech bir ustoz tanlovdan chetlashtirilmaydi, faqat soxta ovozlar o'chiriladi.",
    },
    {
      title: "Muddat",
      body: `Ovoz berish ${fmt.format(VOTING_ENDS_AT)} da yakunlanadi. Shundan so'ng natijalar hisoblanadi va g'oliblar kanalda e'lon qilinadi.`,
    },
    {
      title: "G'oliblar",
      body: `Har bir nominatsiya bo'yicha g'olib HAR BIR FILIALDA alohida aniqlanadi. Jami ${NOMINATIONS.length} ta nominatsiya. Ovoz berganda yozilgan barcha iliq so'zlar 1-oktyabrda ustozlarga albom qilib topshiriladi — g'olib bo'lgan-bo'lmaganidan qat'i nazar.`,
    },
  ];

  return (
    <main>
      <div className="pt-4">
        <BackLink href="/" label="Bosh sahifa" />
      </div>
      <PageTitle title="Qoidalar" subtitle="Tanlov qanday o'tkaziladi" />

      <div className="grid gap-3">
        {rules.map((r, i) => (
          <section
            key={r.title}
            className="card animate-in flex gap-4 p-5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span
              className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm text-white"
              style={{ background: "linear-gradient(140deg,#FF8A5C,#EF5123)" }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-[color:var(--ember)]">{r.title}</h2>
              <p className="muted mt-1.5 text-sm leading-relaxed">{r.body}</p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
