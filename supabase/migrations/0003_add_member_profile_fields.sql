ALTER TABLE members
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS birth_year INT;

-- 4項目とも NULL の間は会話形式の登録フローが未完了であることを示す。
-- 全て埋まった時点で登録完了とみなす（専用フラグは持たない）。
