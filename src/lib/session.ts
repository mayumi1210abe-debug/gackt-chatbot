import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7日

function sign(payload: string): string {
  return createHmac("sha256", process.env.OTP_HASH_SECRET!).update(payload).digest("hex");
}

export function createSessionToken(phoneNumber: string): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${phoneNumber}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export const SESSION_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [phoneNumber, expiresAtStr, signature] = parts;

  const expected = sign(`${phoneNumber}.${expiresAtStr}`);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return null;
  if (!timingSafeEqual(expectedBuf, signatureBuf)) return null;

  if (Date.now() > Number(expiresAtStr)) return null;
  return phoneNumber;
}
