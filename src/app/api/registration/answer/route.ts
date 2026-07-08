import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import {
  FIELD_ORDER,
  nextIncompleteField,
  validateFieldValue,
  type MemberProfile,
} from "@/lib/registration";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const phoneNumber = verifySessionToken(cookieStore.get("session")?.value);
  if (!phoneNumber) {
    return Response.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { field, value } = await req.json();
  if (!(FIELD_ORDER as readonly string[]).includes(field)) {
    return Response.json({ error: "不正な項目です。" }, { status: 400 });
  }

  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select("country, region, gender, birth_year")
    .eq("phone_number", phoneNumber)
    .maybeSingle<MemberProfile>();
  if (error || !member) {
    return Response.json({ error: "会員情報が見つかりません。" }, { status: 404 });
  }

  const expectedField = nextIncompleteField(member);
  if (field !== expectedField) {
    return Response.json({ error: "現在の質問と一致しません。" }, { status: 400 });
  }

  const validated = validateFieldValue(field, value);
  if (validated === null) {
    return Response.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update({ [field]: validated })
    .eq("phone_number", phoneNumber);
  if (updateError) {
    return Response.json({ error: "保存に失敗しました。" }, { status: 500 });
  }

  const nextField = nextIncompleteField({ ...member, [field]: validated });
  return Response.json({ success: true, nextField });
}
