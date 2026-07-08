import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { nextIncompleteField, type MemberProfile } from "@/lib/registration";

export async function GET() {
  const cookieStore = await cookies();
  const phoneNumber = verifySessionToken(cookieStore.get("session")?.value);
  if (!phoneNumber) {
    return Response.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { data: member, error } = await supabaseAdmin
    .from("members")
    .select("country, region, gender, birth_year")
    .eq("phone_number", phoneNumber)
    .maybeSingle<MemberProfile>();

  if (error || !member) {
    return Response.json({ error: "会員情報が見つかりません。" }, { status: 404 });
  }

  return Response.json({ nextField: nextIncompleteField(member), member });
}
