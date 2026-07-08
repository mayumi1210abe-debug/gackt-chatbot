import { requestOtp, OtpError } from "@/lib/otp";

export async function POST(req: Request) {
  const { phoneNumber } = await req.json();

  if (typeof phoneNumber !== "string") {
    return Response.json({ error: "電話番号を入力してください。" }, { status: 400 });
  }

  try {
    await requestOtp(phoneNumber);
    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof OtpError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    console.error("Failed to send OTP", err);
    return Response.json({ error: "認証コードの送信に失敗しました。" }, { status: 500 });
  }
}
