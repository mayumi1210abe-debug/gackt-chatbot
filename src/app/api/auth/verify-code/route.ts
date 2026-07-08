import { verifyOtp, OtpError } from "@/lib/otp";

export async function POST(req: Request) {
  const { phoneNumber, code } = await req.json();

  if (typeof phoneNumber !== "string" || typeof code !== "string") {
    return Response.json({ error: "電話番号と認証コードを入力してください。" }, { status: 400 });
  }

  try {
    const result = await verifyOtp(phoneNumber, code);
    return Response.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof OtpError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to verify OTP", err);
    return Response.json({ error: "認証コードの確認に失敗しました。" }, { status: 500 });
  }
}
