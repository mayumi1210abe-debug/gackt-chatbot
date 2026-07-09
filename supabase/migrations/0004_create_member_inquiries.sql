CREATE TABLE IF NOT EXISTS member_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id),
  category TEXT NOT NULL,
  language TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE member_inquiries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS member_inquiries_member_idx ON member_inquiries (member_id);
CREATE INDEX IF NOT EXISTS member_inquiries_created_idx ON member_inquiries (created_at DESC);

-- ポリシーは意図的に未設定。service role キーを持つサーバーサイド
-- コード（/api/member 配下、管理画面）からのみアクセスする。
