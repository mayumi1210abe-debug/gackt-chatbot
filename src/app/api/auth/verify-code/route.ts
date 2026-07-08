import { verifyOtp, OtpError } from "@/lib/otp";
import { createSessionToken, SESSION_COOKIE_MAX_AGE } from "@/lib/session";

export async function POST(req: Request) {
  const { phoneNumber, code } = await req.json();

  if (typeof phoneNumber !== "string" || typeof code !== "string") {
    return Response.json({ error: "電話番号と認証コードを入力してください。" }, { status: 400 });
  }

  try {
    const result = await verifyOtp(phoneNumber, code);
    const token = createSessionToken(phoneNumber);
    return Response.json(
      { success: true, ...result },
      {
        headers: {
          "Set-Cookie": `session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`,
        },
      },
    );
  } catch (err) {
    if (err instanceof OtpError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to verify OTP", err);
    return Response.json({ error: "認証コードの確認に失敗しました。" }, { status: 500 });
  }
}
