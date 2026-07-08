import { randomInt, createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";

const OTP_TTL_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

export class OtpError extends Error {}

function hashCode(phoneNumber: string, code: string): string {
  return createHash("sha256")
    .update(`${process.env.OTP_HASH_SECRET}:${phoneNumber}:${code}`)
    .digest("hex");
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  return PHONE_RE.test(phoneNumber);
}

export async function requestOtp(phoneNumber: string): Promise<void> {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new OtpError("電話番号の形式が正しくありません(例: +819012345678)。");
  }

  const now = Date.now();
  const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

  const { data: recent, error } = await supabaseAdmin
    .from("otp_codes")
    .select("created_at")
    .eq("phone_number", phoneNumber)
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false });

  if (error) throw new OtpError("送信状況の確認に失敗しました。");

  if (recent.length > 0) {
    const lastSentAt = new Date(recent[0].created_at).getTime();
    const secondsSinceLastSend = (now - lastSentAt) / 1000;
    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      throw new OtpError(
        `再送信まで${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend)}秒お待ちください。`,
      );
    }
  }

  if (recent.length >= MAX_SENDS_PER_HOUR) {
    throw new OtpError("送信回数の上限に達しました。しばらくしてから再度お試しください。");
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(now + OTP_TTL_SECONDS * 1000).toISOString();

  const { error: insertError } = await supabaseAdmin.from("otp_codes").insert({
    phone_number: phoneNumber,
    code_hash: hashCode(phoneNumber, code),
    expires_at: expiresAt,
  });
  if (insertError) throw new OtpError("認証コードの発行に失敗しました。");

  await sendSms(phoneNumber, `認証コード: ${code}(60秒以内に入力してください)`);
}

type VerifyResult = { isNewMember: boolean };

export async function verifyOtp(phoneNumber: string, code: string): Promise<VerifyResult> {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new OtpError("電話番号の形式が正しくありません。");
  }

  const { data: otp, error } = await supabaseAdmin
    .from("otp_codes")
    .select("id, code_hash, expires_at, attempt_count, consumed_at")
    .eq("phone_number", phoneNumber)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new OtpError("認証コードの確認に失敗しました。");
  if (!otp) throw new OtpError("認証コードが見つかりません。再送信してください。");
  if (otp.consumed_at) throw new OtpError("このコードは既に使用されています。再送信してください。");
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    throw new OtpError("認証コードの有効期限が切れています。再送信してください。");
  }
  if (otp.attempt_count >= MAX_ATTEMPTS) {
    throw new OtpError("試行回数の上限に達しました。新しい認証コードを取得してください。");
  }

  if (hashCode(phoneNumber, code) !== otp.code_hash) {
    await supabaseAdmin
      .from("otp_codes")
      .update({ attempt_count: otp.attempt_count + 1 })
      .eq("id", otp.id);
    const remaining = MAX_ATTEMPTS - (otp.attempt_count + 1);
    throw new OtpError(
      remaining > 0
        ? `認証コードが正しくありません。残り${remaining}回試行できます。`
        : "試行回数の上限に達しました。新しい認証コードを取得してください。",
    );
  }

  await supabaseAdmin
    .from("otp_codes")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", otp.id);

  const { data: existingMember } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (existingMember) {
    return { isNewMember: false };
  }

  const { error: memberInsertError } = await supabaseAdmin
    .from("members")
    .insert({ phone_number: phoneNumber });
  if (memberInsertError) throw new OtpError("会員情報の登録に失敗しました。");

  return { isNewMember: true };
}
