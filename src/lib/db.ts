import { neon } from "@neondatabase/serverless";

type NeonSql = ReturnType<typeof neon>;

let _sql: NeonSql | null = null;

function client(): NeonSql {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL o'rnatilmagan");
    _sql = neon(url);
  }
  return _sql;
}

/** Tagged template: sql`SELECT ...` — ulanish birinchi so'rovda ochiladi */
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  (client() as unknown as (
    s: TemplateStringsArray,
    ...v: unknown[]
  ) => unknown)(strings, ...values)) as unknown as NeonSql;

/** Neon so'rovini kerakli turga keltirish (Promise.all ichida ishlatish uchun) */
export function rows<T>(p: PromiseLike<unknown>): Promise<T[]> {
  return Promise.resolve(p) as unknown as Promise<T[]>;
}

/* ---------- Turlar ---------- */

export interface Branch {
  id: number;
  slug: string;
  name: string;
  address: string | null;
  sort_order: number;
}

export interface Teacher {
  id: number;
  branch_id: number;
  full_name: string;
  subject: string | null;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface User {
  id: number;
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  phone: string | null;
  is_student: boolean | null;
  branch_id: number | null;
  referred_by: number | null;
  subscribed: boolean;
  is_blocked: boolean;
  suspicion: number;
}

export interface Vote {
  id: number;
  user_id: number;
  teacher_id: number;
  nomination: string;
  kind: "main" | "bonus";
  comment: string | null;
  created_at: string;
}

/* ---------- Filiallar ---------- */

export async function getBranches(): Promise<Branch[]> {
  return (await sql`
    SELECT id, slug, name, address, sort_order
    FROM branches ORDER BY sort_order, id
  `) as Branch[];
}

export async function getBranchBySlug(slug: string): Promise<Branch | null> {
  const rows = (await sql`
    SELECT id, slug, name, address, sort_order FROM branches WHERE slug = ${slug}
  `) as Branch[];
  return rows[0] ?? null;
}

/* ---------- Ustozlar ---------- */

export async function getTeachersByBranch(branchId: number): Promise<Teacher[]> {
  return (await sql`
    SELECT id, branch_id, full_name, subject, bio, photo_url, is_active, sort_order
    FROM teachers
    WHERE branch_id = ${branchId} AND is_active
    ORDER BY sort_order, full_name
  `) as Teacher[];
}

export async function getTeacher(id: number): Promise<Teacher | null> {
  const rows = (await sql`
    SELECT id, branch_id, full_name, subject, bio, photo_url, is_active, sort_order
    FROM teachers WHERE id = ${id}
  `) as Teacher[];
  return rows[0] ?? null;
}

/* ---------- Foydalanuvchi ---------- */

export async function getUserById(id: number): Promise<User | null> {
  const rows = (await sql`
    SELECT id, telegram_id, first_name, last_name, username, phone,
           is_student, branch_id, referred_by, subscribed, is_blocked, suspicion
    FROM users WHERE id = ${id}
  `) as User[];
  return rows[0] ?? null;
}

export async function getUserByTelegramId(tgId: number): Promise<User | null> {
  const rows = (await sql`
    SELECT id, telegram_id, first_name, last_name, username, phone,
           is_student, branch_id, referred_by, subscribed, is_blocked, suspicion
    FROM users WHERE telegram_id = ${tgId}
  `) as User[];
  return rows[0] ?? null;
}

export async function upsertUser(input: {
  telegramId: number;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): Promise<User> {
  const rows = (await sql`
    INSERT INTO users (telegram_id, first_name, last_name, username)
    VALUES (${input.telegramId}, ${input.firstName ?? null},
            ${input.lastName ?? null}, ${input.username ?? null})
    ON CONFLICT (telegram_id) DO UPDATE
      SET first_name = EXCLUDED.first_name,
          last_name  = EXCLUDED.last_name,
          username   = EXCLUDED.username
    RETURNING id, telegram_id, first_name, last_name, username, phone,
              is_student, branch_id, referred_by, subscribed, is_blocked, suspicion
  `) as User[];
  return rows[0];
}

/** Telefon raqamini yagona formatga keltirish: faqat raqamlar, oxirgi 9 ta */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.slice(-9);
}

/**
 * Telefonni saqlaydi. Agar shu raqam boshqa akkauntda bo'lsa — false qaytaradi.
 */
export async function setUserPhone(
  userId: number,
  phone: string,
): Promise<{ ok: boolean; reason?: "duplicate" }> {
  const norm = normalizePhone(phone);
  const taken = (await sql`
    SELECT id FROM users WHERE phone_norm = ${norm} AND id <> ${userId}
  `) as { id: number }[];
  if (taken.length > 0) return { ok: false, reason: "duplicate" };

  await sql`
    UPDATE users SET phone = ${phone}, phone_norm = ${norm} WHERE id = ${userId}
  `;
  return { ok: true };
}

export async function setUserSubscribed(userId: number, value: boolean) {
  await sql`
    UPDATE users SET subscribed = ${value}, sub_checked_at = now() WHERE id = ${userId}
  `;
}

export async function setUserProfile(
  userId: number,
  isStudent: boolean,
  branchId: number | null,
) {
  await sql`
    UPDATE users SET is_student = ${isStudent}, branch_id = ${branchId}
    WHERE id = ${userId}
  `;
}

/* ---------- Referal ---------- */

export async function linkReferral(inviterId: number, invitedId: number) {
  if (inviterId === invitedId) return;
  await sql`
    INSERT INTO referrals (inviter_id, invited_id) VALUES (${inviterId}, ${invitedId})
    ON CONFLICT (invited_id) DO NOTHING
  `;
  await sql`
    UPDATE users SET referred_by = ${inviterId}
    WHERE id = ${invitedId} AND referred_by IS NULL
  `;
}

/** Taklif qilingan odam ovoz bergach chaqiriladi */
export async function markReferralCounted(invitedId: number) {
  await sql`
    UPDATE referrals SET counted = TRUE, counted_at = now()
    WHERE invited_id = ${invitedId} AND counted = FALSE
  `;
}

export async function countReferrals(
  userId: number,
): Promise<{ total: number; counted: number }> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE counted)::int AS counted
    FROM referrals WHERE inviter_id = ${userId}
  `) as { total: number; counted: number }[];
  return rows[0] ?? { total: 0, counted: 0 };
}

/* ---------- Ovozlar ---------- */

export async function getUserVotes(userId: number): Promise<Vote[]> {
  return (await sql`
    SELECT id, user_id, teacher_id, nomination, kind, comment, created_at
    FROM votes WHERE user_id = ${userId} ORDER BY created_at
  `) as Vote[];
}

export async function insertVote(input: {
  userId: number;
  teacherId: number;
  nomination: string;
  kind: "main" | "bonus";
  comment: string | null;
  ipHash: string | null;
}): Promise<number> {
  const rows = (await sql`
    INSERT INTO votes (user_id, teacher_id, nomination, kind, comment, ip_hash)
    VALUES (${input.userId}, ${input.teacherId}, ${input.nomination},
            ${input.kind}, ${input.comment}, ${input.ipHash})
    RETURNING id
  `) as { id: number }[];
  return rows[0].id;
}
