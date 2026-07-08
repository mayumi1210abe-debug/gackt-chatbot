import Link from "next/link";
import { sql } from "@/lib/db";
import {
  CATEGORIES,
  LANGUAGES,
  type Category,
  type LanguageCode,
} from "@/lib/classification";

export const dynamic = "force-dynamic";

const CATEGORY_COLOR: Record<Category, string> = {
  問い合わせ: "var(--series-1)",
  チケット希望: "var(--series-2)",
  告知反応: "var(--series-3)",
  その他: "var(--series-4)",
};

const LANGUAGE_COLOR: Record<LanguageCode, string> = {
  ja: "var(--series-1)",
  en: "var(--series-2)",
  "zh-TW": "var(--series-3)",
  yue: "var(--series-4)",
  es: "var(--series-5)",
  ko: "var(--series-6)",
  fr: "var(--series-7)",
  th: "var(--series-8)",
};

type Row = { label: string; count: number; color: string };

async function getCategoryCounts(): Promise<Row[]> {
  const rows = (await sql`
    SELECT category, COUNT(*)::int AS count
    FROM chat_classifications
    GROUP BY category
  `) as { category: string; count: number }[];

  const countByCategory = new Map(rows.map((row) => [row.category, row.count]));
  return CATEGORIES.map((category) => ({
    label: category,
    count: countByCategory.get(category) ?? 0,
    color: CATEGORY_COLOR[category],
  }));
}

async function getLanguageCounts(): Promise<Row[]> {
  const rows = (await sql`
    SELECT language, COUNT(*)::int AS count
    FROM chat_classifications
    GROUP BY language
  `) as { language: string; count: number }[];

  const countByLanguage = new Map(rows.map((row) => [row.language, row.count]));
  return LANGUAGES.map(({ code, label }) => ({
    label,
    count: countByLanguage.get(code) ?? 0,
    color: LANGUAGE_COLOR[code],
  }));
}

function BarList({ rows }: { rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-3">
      {rows.map(({ label, count, color }) => (
        <div key={label} className="flex items-center gap-3">
          <span
            className="w-24 shrink-0 text-sm text-black/70 dark:text-white/70"
            style={{ borderLeft: `3px solid ${color}`, paddingLeft: 8 }}
          >
            {label}
          </span>
          <div className="h-5 flex-1 rounded-full bg-black/5 dark:bg-white/10">
            <div
              className="h-5 rounded-full"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: color,
                minWidth: count > 0 ? "8px" : "0px",
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm tabular-nums text-black/70 dark:text-white/70">
            {count.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function CountTable({ headLabel, rows }: { headLabel: string; rows: Row[] }) {
  return (
    <table className="mt-4 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-black/10 text-left dark:border-white/10">
          <th className="py-2 font-medium text-black/50 dark:text-white/50">{headLabel}</th>
          <th className="py-2 text-right font-medium text-black/50 dark:text-white/50">件数</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ label, count }) => (
          <tr key={label} className="border-b border-black/5 dark:border-white/5">
            <td className="py-2">{label}</td>
            <td className="py-2 text-right tabular-nums">{count.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function DashboardPage() {
  const [categoryCounts, languageCounts] = await Promise.all([
    getCategoryCounts(),
    getLanguageCounts(),
  ]);
  const total = categoryCounts.reduce((sum, c) => sum + c.count, 0);

  return (
    <div
      className="viz-root mx-auto w-full max-w-2xl px-4 py-8"
      style={
        {
          "--series-1": "#2a78d6",
          "--series-2": "#1baf7a",
          "--series-3": "#eda100",
          "--series-4": "#008300",
          "--series-5": "#4a3aa7",
          "--series-6": "#e34948",
          "--series-7": "#e87ba4",
          "--series-8": "#eb6834",
        } as React.CSSProperties
      }
    >
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-lg font-semibold">分類ダッシュボード</h1>
        <Link
          href="/"
          className="text-sm text-black/50 underline underline-offset-2 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
        >
          チャットに戻る
        </Link>
      </header>

      <div className="mb-8 rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10">
        <p className="text-xs text-black/50 dark:text-white/50">合計件数</p>
        <p className="text-3xl font-semibold">{total.toLocaleString()}</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-black/70 dark:text-white/70">
          分類別件数
        </h2>
        <BarList rows={categoryCounts} />
        <CountTable headLabel="カテゴリ" rows={categoryCounts} />
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-black/70 dark:text-white/70">
          言語別件数
        </h2>
        <BarList rows={languageCounts} />
        <CountTable headLabel="言語" rows={languageCounts} />
      </section>
    </div>
  );
}
