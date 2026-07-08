CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- ポリシーは意図的に未設定。SMS認証(Lesson 2-3)を実装するまでは
-- service role キーを持つサーバーサイドコードのみがアクセスできる。
