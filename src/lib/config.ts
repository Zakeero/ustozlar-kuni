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
  /** CSS gradient — kartochka belgisi foni */
  accent: string;
  /** Yordamchi rang — chegara va matn uchun */
  tint: string;
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
    accent: "linear-gradient(140deg, #FF7A3D, #EF5123)",
    tint: "#EF5123",
  },
  {
    key: "bolt",
    emoji: "⚡",
    title: "Eng talabchan ustoz",
    description: "Qattiqqo'l, lekin aynan shuning uchun natija beradigan ustoz",
    accent: "linear-gradient(140deg, #F6C453, #E8A33D)",
    tint: "#B97D14",
  },
  {
    key: "smile",
    emoji: "😊",
    title: "Eng samimiy ustoz",
    description: "Har doim kulib turadigan, iliq muomalali ustoz",
    accent: "linear-gradient(140deg, #FFB08A, #F07A4B)",
    tint: "#C9562A",
  },
  {
    key: "heart",
    emoji: "🧡",
    title: "Eng g'amxo'r ustoz",
    description: "O'quvchisini tushunadigan, doim yordamga tayyor ustoz",
    accent: "linear-gradient(140deg, #F2656B, #D6304A)",
    tint: "#C02840",
  },
  {
    key: "like",
    emoji: "👍",
    title: "Eng bilimdon ustoz",
    description: "Fanini mukammal biladigan, har savolga javobi bor ustoz",
    accent: "linear-gradient(140deg, #2AA6A0, #12807C)",
    tint: "#0C5F5C",
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
