import Link from "next/link";
import { sql } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/classification";

export const dynamic = "force-dynamic";

const CATEGORY_COLOR: Record<Category, string> = {
  予約: "var(--series-1)",
  料金: "var(--series-2)",
  クレーム: "var(--series-3)",
  その他: "var(--series-4)",
};

async function getCounts() {
  const rows = (await sql`
    SELECT category, COUNT(*)::int AS count
    FROM chat_classifications
    GROUP BY category
  `) as { category: string; count: number }[];

  const countByCategory = new Map(rows.map((row) => [row.category, row.count]));
  return CATEGORIES.map((category) => ({
    category,
    count: countByCategory.get(category) ?? 0,
  }));
}

export default async function DashboardPage() {
  const counts = await getCounts();
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div
      className="viz-root mx-auto w-full max-w-2xl px-4 py-8"
      style={
        {
          "--series-1": "#2a78d6",
          "--series-2": "#eda100",
          "--series-3": "#e34948",
          "--series-4": "#4a3aa7",
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

      <div className="space-y-4">
        {counts.map(({ category, count }) => {
          const widthPercent = (count / max) * 100;
          return (
            <div key={category} className="flex items-center gap-3">
              <span
                className="w-16 shrink-0 text-sm text-black/70 dark:text-white/70"
                style={{ borderLeft: `3px solid ${CATEGORY_COLOR[category]}`, paddingLeft: 8 }}
              >
                {category}
              </span>
              <div className="h-5 flex-1 rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-5 rounded-full"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: CATEGORY_COLOR[category],
                    minWidth: count > 0 ? "8px" : "0px",
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-black/70 dark:text-white/70">
                {count.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      <table className="mt-10 w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-xs text-black/50 dark:text-white/50">
          テーブル表示
        </caption>
        <thead>
          <tr className="border-b border-black/10 text-left dark:border-white/10">
            <th className="py-2 font-medium text-black/50 dark:text-white/50">カテゴリ</th>
            <th className="py-2 text-right font-medium text-black/50 dark:text-white/50">
              件数
            </th>
          </tr>
        </thead>
        <tbody>
          {counts.map(({ category, count }) => (
            <tr key={category} className="border-b border-black/5 dark:border-white/5">
              <td className="py-2">{category}</td>
              <td className="py-2 text-right tabular-nums">{count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
