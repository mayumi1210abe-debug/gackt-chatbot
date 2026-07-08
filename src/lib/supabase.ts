import { createClient } from "@supabase/supabase-js";

// RLS を全ポリシー拒否のまま運用するため、member テーブルへのアクセスは
// service role キーを持つサーバーサイドコードからのみ行う。
export const supabaseAdmin = createClient(
  process.env.SUPABASE_MEMBERS_SUPABASE_URL!,
  process.env.SUPABASE_MEMBERS_SUPABASE_SERVICE_ROLE_KEY!,
);
