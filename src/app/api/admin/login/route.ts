import { timingSafeEqual } from "crypto";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE_MAX_AGE } from "@/lib/session";

function passwordMatches(input: string, expected: string): boolean {
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(inputBuf, expectedBuf);
}

export async function POST(req: Request) {
  const { password } = await req.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (
    typeof password !== "string" ||
    !adminPassword ||
    !passwordMatches(password, adminPassword)
  ) {
    return Response.json({ error: "パスワードが正しくありません。" }, { status: 401 });
  }

  const token = createAdminSessionToken();
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": `admin_session=${token}; HttpOnly; Path=/; Max-Age=${ADMIN_SESSION_COOKIE_MAX_AGE}; SameSite=Lax`,
      },
    },
  );
}
