import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getUserById, type User } from "./db";

const SESSION_COOKIE = "uk_session";
const ADMIN_COOKIE = "uk_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 kun

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET kamida 16 belgidan iborat bo'lishi kerak");
  }
  return new TextEncoder().encode(s);
}

async function sign(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

/* ---------- Foydalanuvchi sessiyasi ---------- */

export async function createSession(userId: number) {
  const token = await sign({ uid: userId });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSessionUserId(): Promise<number | null> {
  const c = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c, secret());
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  return getUserById(id);
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/* ---------- Admin sessiyasi ---------- */

export async function createAdminSession() {
  const token = await sign({ role: "admin" });
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function isAdmin(): Promise<boolean> {
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!c) return false;
  try {
    const { payload } = await jwtVerify(c, secret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function destroyAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
