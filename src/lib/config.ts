/**
 * Loyihaning barcha qoidalari shu yerda.
 * O'zgartirish kerak bo'lsa — faqat shu faylga tegiladi.
 */

export const SITE = {
  title: "Ustozlar kuni 2026",
  org: "Registon O'quv Markazi",
  tagline: "Ustozingizga minnatdorchilik bildiring",
  channel: process.env.NEXT_PUBLIC_CHANNEL_USERNAME || "registon_lc",
  botUsername: process.env.NEXT_PUBLIC_BOT_USERNAME || "registon_ustozlar_bot",
};

/** Ovoz berish tugash vaqti — 1-oktyabr 12:00, Toshkent (UTC+5) */
export const VOTING_ENDS_AT = new Date("2026-10-01T12:00:00+05:00");

/** Natijalar e'lon qilinadigan vaqt (shu vaqtgacha "tez orada" animatsiyasi) */
export const RESULTS_AT = new Date("2026-10-01T18:00:00+05:00");

/** Har bir foydalanuvchining asosiy ovozlari — har biri BOSHQA ustozga */
export const MAIN_VOTES = 3;

/** Referal orqali olinadigan maksimal qo'shimcha ovoz */
export const MAX_BONUS_VOTES = 10;

/**
 * Bonus ovozlar bitta ustozga yig'ilishi mumkinmi?
 * false qilinsa — bonus ovozlar ham har xil ustozga beriladi.
 */
export const BONUS_ALLOWS_SAME_TEACHER = true;

/** Kanalga obuna majburiymi */
export const REQUIRE_CHANNEL_SUBSCRIPTION = true;

/** Telefon raqami majburiymi (anti-fraud uchun asosiy filtr) */
export const REQUIRE_PHONE = true;

/** Filial ichida ko'rsatiladigan top nechta ustoz (raqamlarsiz) */
export const PUBLIC_TOP_SIZE = 3;

export type NominationKey = "fire" | "bolt" | "smile" | "heart" | "like";

export interface Nomination {
  key: NominationKey;
  emoji: string;
  title: string;
  description: string;
  /** Tailwind gradient — kartochka va tugma ranglari */
  accent: string;
}

/**
 * 5 ta reaksiya = 5 ta nominatsiya.
 * O'quvchi ovoz berayotganda qaysi nominatsiyaga ovoz berayotganini ANIQ biladi.
 */
export const NOMINATIONS: Nomination[] = [
  {
    key: "fire",
    emoji: "🔥",
    title: "Eng qiziqarli dars",
    description: "Darsi zerikarli o'tmaydigan, hamma intiladigan ustoz",
    accent: "from-orange-500 to-red-500",
  },
  {
    key: "bolt",
    emoji: "⚡",
    title: "Eng talabchan ustoz",
    description: "Qattiqqo'l, lekin aynan shuning uchun natija beradigan ustoz",
    accent: "from-amber-400 to-yellow-500",
  },
  {
    key: "smile",
    emoji: "😊",
    title: "Eng samimiy ustoz",
    description: "Har doim kulib turadigan, iliq muomalali ustoz",
    accent: "from-sky-400 to-blue-500",
  },
  {
    key: "heart",
    emoji: "🧡",
    title: "Eng g'amxo'r ustoz",
    description: "O'quvchisini tushunadigan, doim yordamga tayyor ustoz",
    accent: "from-rose-400 to-pink-500",
  },
  {
    key: "like",
    emoji: "👍",
    title: "Eng bilimdon ustoz",
    description: "Fanini mukammal biladigan, har savolga javobi bor ustoz",
    accent: "from-emerald-400 to-teal-500",
  },
];

export const NOMINATION_MAP: Record<NominationKey, Nomination> =
  Object.fromEntries(NOMINATIONS.map((n) => [n.key, n])) as Record<
    NominationKey,
    Nomination
  >;

export function isNominationKey(v: unknown): v is NominationKey {
  return typeof v === "string" && v in NOMINATION_MAP;
}

export function votingOpen(now: Date = new Date()): boolean {
  return now < VOTING_ENDS_AT;
}

export function resultsPublished(now: Date = new Date()): boolean {
  return now >= RESULTS_AT;
}
