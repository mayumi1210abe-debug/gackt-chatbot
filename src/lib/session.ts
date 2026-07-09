import { createHmac, timingSafeEqual } from "crypto";

function sign(payload: string): string {
  return createHmac("sha256", process.env.OTP_HASH_SECRET!).update(payload).digest("hex");
}

function createToken(subject: string, ttlSeconds: number): string {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${subject}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [subject, expiresAtStr, signature] = parts;

  const expected = sign(`${subject}.${expiresAtStr}`);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, signatureBuf)) return null;

  if (Date.now() > Number(expiresAtStr)) return null;
  return subject;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7日
export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;

export function createSessionToken(phoneNumber: string): string {
  return createToken(phoneNumber, SESSION_TTL_SECONDS);
}

export function verifySessionToken(token: string | undefined): string | null {
  return verifyToken(token);
}

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12時間
export const ADMIN_SESSION_COOKIE_MAX_AGE = ADMIN_SESSION_TTL_SECONDS;
const ADMIN_SUBJECT = "admin";

export function createAdminSessionToken(): string {
  return createToken(ADMIN_SUBJECT, ADMIN_SESSION_TTL_SECONDS);
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  return verifyToken(token) === ADMIN_SUBJECT;
}
