import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { analyzeMessage } from "@/lib/analyze";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const phoneNumber = verifySessionToken(cookieStore.get("session")?.value);
  if (!phoneNumber) {
    return Response.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { message } = await req.json();
  if (typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "内容を入力してください。" }, { status: 400 });
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("phone_number", phoneNumber)
    .maybeSingle();
  if (memberError || !member) {
    return Response.json({ error: "会員情報が見つかりません。" }, { status: 404 });
  }

  const analysis = await analyzeMessage(message);

  const { error: insertError } = await supabaseAdmin.from("member_inquiries").insert({
    member_id: member.id,
    category: analysis.category,
    language: analysis.language,
    message: message.trim(),
  });
  if (insertError) {
    return Response.json({ error: "送信に失敗しました。" }, { status: 500 });
  }

  return Response.json({ success: true, category: analysis.category });
}
