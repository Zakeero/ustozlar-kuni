"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";
import { isAdmin } from "@/lib/session";

async function guard() {
  if (!(await isAdmin())) throw new Error("Ruxsat yo'q");
}

/* ---------- Filiallar ---------- */

export async function createBranch(formData: FormData) {
  await guard();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const address = String(formData.get("address") ?? "").trim() || null;
  if (!name || !slug) return;

  await sql`
    INSERT INTO branches (name, slug, address) VALUES (${name}, ${slug}, ${address})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address
  `;
  revalidatePath("/admin/filiallar");
}

export async function deleteBranch(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (!id) return;
  await sql`DELETE FROM branches WHERE id = ${id}`;
  revalidatePath("/admin/filiallar");
}

/* ---------- Ustozlar ---------- */

export async function createTeacher(formData: FormData) {
  await guard();
  const branchId = Number(formData.get("branch_id"));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  if (!branchId || !fullName) return;

  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const blob = await put(`ustozlar/${Date.now()}-${photo.name}`, photo, {
      access: "public",
      addRandomSuffix: true,
    });
    photoUrl = blob.url;
  }

  await sql`
    INSERT INTO teachers (branch_id, full_name, subject, bio, photo_url)
    VALUES (${branchId}, ${fullName}, ${subject}, ${bio}, ${photoUrl})
  `;
  revalidatePath("/admin/ustozlar");
}

/** Bir nechta ustozni bir marta qo'shish: har qatorda "Ism | Fan" */
export async function bulkCreateTeachers(formData: FormData) {
  await guard();
  const branchId = Number(formData.get("branch_id"));
  const raw = String(formData.get("lines") ?? "");
  if (!branchId || !raw.trim()) return;

  const rows = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, subject] = l.split("|").map((s) => s.trim());
      return { name, subject: subject || null };
    })
    .filter((r) => r.name);

  for (const r of rows) {
    await sql`
      INSERT INTO teachers (branch_id, full_name, subject)
      VALUES (${branchId}, ${r.name}, ${r.subject})
    `;
  }
  revalidatePath("/admin/ustozlar");
}

export async function updateTeacher(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (!id) return;
  const fullName = String(formData.get("full_name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;

  let photoUrl: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const blob = await put(`ustozlar/${Date.now()}-${photo.name}`, photo, {
      access: "public",
      addRandomSuffix: true,
    });
    photoUrl = blob.url;
  }

  if (photoUrl) {
    await sql`
      UPDATE teachers SET full_name = ${fullName}, subject = ${subject},
                          bio = ${bio}, photo_url = ${photoUrl}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE teachers SET full_name = ${fullName}, subject = ${subject}, bio = ${bio}
      WHERE id = ${id}
    `;
  }
  revalidatePath("/admin/ustozlar");
}

export async function toggleTeacher(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (!id) return;
  await sql`UPDATE teachers SET is_active = NOT is_active WHERE id = ${id}`;
  revalidatePath("/admin/ustozlar");
}

/* ---------- Foydalanuvchilar / fraud ---------- */

export async function toggleUserBlock(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (!id) return;
  await sql`UPDATE users SET is_blocked = NOT is_blocked WHERE id = ${id}`;
  revalidatePath("/admin/shubhali");
  revalidatePath("/admin");
}

/** Bitta referal daraxtidagi barcha ovozlarni bekor qilish */
export async function invalidateReferralTree(formData: FormData) {
  await guard();
  const inviterId = Number(formData.get("inviter_id"));
  if (!inviterId) return;
  await sql`
    UPDATE votes SET is_valid = FALSE
    WHERE user_id IN (
      SELECT invited_id FROM referrals WHERE inviter_id = ${inviterId}
    )
  `;
  revalidatePath("/admin/shubhali");
}

/* ---------- Izohlarni yashirish ---------- */

export async function hideComment(formData: FormData) {
  await guard();
  const id = Number(formData.get("id"));
  if (!id) return;
  await sql`UPDATE votes SET comment = NULL WHERE id = ${id}`;
  revalidatePath("/admin/soz");
}
