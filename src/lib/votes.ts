import {
  MAIN_VOTES,
  MAX_BONUS_VOTES,
  BONUS_ALLOWS_SAME_TEACHER,
  REQUIRE_PHONE,
  REQUIRE_CHANNEL_SUBSCRIPTION,
  votingOpen,
} from "./config";
import {
  countReferrals,
  getUserVotes,
  getUserById,
  insertVote,
  markReferralCounted,
  sql,
  type Vote,
} from "./db";

export interface VoteBudget {
  mainUsed: number;
  mainLeft: number;
  bonusEarned: number;
  bonusUsed: number;
  bonusLeft: number;
  totalLeft: number;
  referralsTotal: number;
  referralsCounted: number;
  votedTeacherIds: number[];
}

export async function getVoteBudget(userId: number): Promise<VoteBudget> {
  const [votes, refs] = await Promise.all([
    getUserVotes(userId),
    countReferrals(userId),
  ]);

  const mainUsed = votes.filter((v) => v.kind === "main").length;
  const bonusUsed = votes.filter((v) => v.kind === "bonus").length;
  const bonusEarned = Math.min(refs.counted, MAX_BONUS_VOTES);

  return {
    mainUsed,
    mainLeft: Math.max(0, MAIN_VOTES - mainUsed),
    bonusEarned,
    bonusUsed,
    bonusLeft: Math.max(0, bonusEarned - bonusUsed),
    totalLeft: Math.max(0, MAIN_VOTES - mainUsed) + Math.max(0, bonusEarned - bonusUsed),
    referralsTotal: refs.total,
    referralsCounted: refs.counted,
    votedTeacherIds: votes.filter((v) => v.kind === "main").map((v) => v.teacher_id),
  };
}

export type VoteError =
  | "closed"
  | "no_user"
  | "blocked"
  | "no_phone"
  | "not_subscribed"
  | "no_votes_left"
  | "already_voted_main"
  | "bad_teacher";

export interface VoteResult {
  ok: boolean;
  error?: VoteError;
  kind?: "main" | "bonus";
  voteId?: number;
  budget?: VoteBudget;
}

/**
 * Ovoz berish. Barcha qoidalar shu funksiyada tekshiriladi.
 *
 * Mantiq:
 *  1. Avval asosiy ovozlar sarflanadi (3 ta, har biri boshqa ustozga).
 *  2. Asosiylar tugagach — referal bonuslari ishlaydi.
 *  3. Bonus ovoz bir ustozga takror berilishi mumkin (config bilan boshqariladi).
 */
export async function castVote(input: {
  userId: number;
  teacherId: number;
  nomination: string;
  comment?: string | null;
  ipHash?: string | null;
}): Promise<VoteResult> {
  if (!votingOpen()) return { ok: false, error: "closed" };

  const user = await getUserById(input.userId);
  if (!user) return { ok: false, error: "no_user" };
  if (user.is_blocked) return { ok: false, error: "blocked" };
  if (REQUIRE_PHONE && !user.phone) return { ok: false, error: "no_phone" };
  if (REQUIRE_CHANNEL_SUBSCRIPTION && !user.subscribed)
    return { ok: false, error: "not_subscribed" };

  const teacher = (await sql`
    SELECT id FROM teachers WHERE id = ${input.teacherId} AND is_active
  `) as { id: number }[];
  if (teacher.length === 0) return { ok: false, error: "bad_teacher" };

  const budget = await getVoteBudget(input.userId);
  const alreadyMain = budget.votedTeacherIds.includes(input.teacherId);

  let kind: "main" | "bonus";
  if (budget.mainLeft > 0 && !alreadyMain) {
    kind = "main";
  } else if (budget.bonusLeft > 0) {
    if (!BONUS_ALLOWS_SAME_TEACHER && alreadyMain)
      return { ok: false, error: "already_voted_main" };
    kind = "bonus";
  } else if (budget.mainLeft > 0 && alreadyMain) {
    return { ok: false, error: "already_voted_main" };
  } else {
    return { ok: false, error: "no_votes_left" };
  }

  let voteId: number;
  try {
    voteId = await insertVote({
      userId: input.userId,
      teacherId: input.teacherId,
      nomination: input.nomination,
      kind,
      comment: input.comment?.trim() ? input.comment.trim().slice(0, 500) : null,
      ipHash: input.ipHash ?? null,
    });
  } catch {
    // unique index ishga tushdi — bir vaqtda ikki so'rov kelgan
    return { ok: false, error: "already_voted_main" };
  }

  // Bu foydalanuvchining birinchi ovozi bo'lsa — uni taklif qilgan odamga bonus
  if (budget.mainUsed === 0 && budget.bonusUsed === 0) {
    await markReferralCounted(input.userId);
  }

  return { ok: true, kind, voteId, budget: await getVoteBudget(input.userId) };
}

export const VOTE_ERROR_TEXT: Record<VoteError, string> = {
  closed: "Ovoz berish yakunlandi.",
  no_user: "Avval Telegram bot orqali kiring.",
  blocked: "Sizning akkauntingiz vaqtincha cheklangan.",
  no_phone: "Ovoz berish uchun botda telefon raqamingizni ulashing.",
  not_subscribed: "Ovoz berish uchun kanalimizga obuna bo'ling.",
  no_votes_left:
    "Ovozlaringiz tugadi. Do'stingizni taklif qilib qo'shimcha ovoz oling.",
  already_voted_main: "Siz bu ustozga allaqachon ovoz bergansiz.",
  bad_teacher: "Ustoz topilmadi.",
};

/* ---------- Statistika (faqat admin uchun) ---------- */

export interface TeacherScore {
  teacher_id: number;
  full_name: string;
  branch_id: number;
  nomination: string;
  votes: number;
}

export async function getScores(): Promise<TeacherScore[]> {
  return (await sql`
    SELECT t.id AS teacher_id, t.full_name, t.branch_id,
           v.nomination, COUNT(*)::int AS votes
    FROM votes v
    JOIN teachers t ON t.id = v.teacher_id
    JOIN users u ON u.id = v.user_id
    WHERE v.is_valid AND NOT u.is_blocked
    GROUP BY t.id, t.full_name, t.branch_id, v.nomination
    ORDER BY votes DESC
  `) as TeacherScore[];
}

/** Ommaviy: filial ichidagi top ustozlar, raqamlarsiz */
export async function getPublicTop(
  branchId: number,
  limit: number,
): Promise<{ teacher_id: number; full_name: string; photo_url: string | null }[]> {
  return (await sql`
    SELECT t.id AS teacher_id, t.full_name, t.photo_url
    FROM votes v
    JOIN teachers t ON t.id = v.teacher_id
    JOIN users u ON u.id = v.user_id
    WHERE v.is_valid AND NOT u.is_blocked AND t.branch_id = ${branchId}
    GROUP BY t.id, t.full_name, t.photo_url
    ORDER BY COUNT(*) DESC, t.full_name
    LIMIT ${limit}
  `) as { teacher_id: number; full_name: string; photo_url: string | null }[];
}
