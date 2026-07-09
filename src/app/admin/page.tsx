import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSessionToken } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import { CATEGORIES, LANGUAGES, languageLabel } from "@/lib/classification";
import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

type Inquiry = {
  id: string;
  category: string;
  language: string;
  message: string;
  created_at: string;
  members: { phone_number: string; country: string | null; region: string | null } | null;
};

async function getFilterOptions() {
  const { data } = await supabaseAdmin.from("members").select("country, region");
  const countries = [...new Set((data ?? []).map((d) => d.country).filter(Boolean))].sort() as string[];
  const regions = [...new Set((data ?? []).map((d) => d.region).filter(Boolean))].sort() as string[];
  return { countries, regions };
}

async function getInquiries(searchParams: Record<string, string | undefined>) {
  let query = supabaseAdmin
    .from("member_inquiries")
    .select("id, category, language, message, created_at, members!inner(phone_number, country, region)")
    .order("created_at", { ascending: false });

  if (searchParams.category) query = query.eq("category", searchParams.category);
  if (searchParams.language) query = query.eq("language", searchParams.language);
  if (searchParams.country) query = query.eq("members.country", searchParams.country);
  if (searchParams.region) query = query.eq("members.region", searchParams.region);
  if (searchParams.dateFrom) query = query.gte("created_at", searchParams.dateFrom);
  if (searchParams.dateTo) query = query.lte("created_at", `${searchParams.dateTo}T23:59:59`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as Inquiry[];
}

function FilterSelect({
  name,
  value,
  options,
  label,
}: {
  name: string;
  value: string | undefined;
  options: string[];
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20"
      >
        <option value="">すべて</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const cookieStore = await cookies();
  if (!verifyAdminSessionToken(cookieStore.get("admin_session")?.value)) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const [{ countries, regions }, inquiries] = await Promise.all([
    getFilterOptions(),
    getInquiries(params),
  ]);

  const regionCounts = new Map<string, number>();
  for (const inquiry of inquiries) {
    const region = inquiry.members?.region ?? "不明";
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  }
  const sortedRegionCounts = [...regionCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxRegionCount = Math.max(1, ...sortedRegionCounts.map(([, count]) => count));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-lg font-semibold">管理画面</h1>
        <AdminLogoutButton />
      </header>

      <form className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-black/10 p-4 sm:grid-cols-3 md:grid-cols-6 dark:border-white/10">
        <FilterSelect name="category" value={params.category} options={[...CATEGORIES]} label="種別" />
        <FilterSelect
          name="language"
          value={params.language}
          options={LANGUAGES.map((l) => l.code)}
          label="言語"
        />
        <FilterSelect name="country" value={params.country} options={countries} label="国" />
        <FilterSelect name="region" value={params.region} options={regions} label="地域" />
        <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
          開始日
          <input
            type="date"
            name="dateFrom"
            defaultValue={params.dateFrom ?? ""}
            className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-black/60 dark:text-white/60">
          終了日
          <input
            type="date"
            name="dateTo"
            defaultValue={params.dateTo ?? ""}
            className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20"
          />
        </label>
        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            絞り込む
          </button>
          <a
            href="/admin"
            className="rounded-full border border-black/15 px-4 py-1.5 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            リセット
          </a>
        </div>
      </form>

      <div className="mb-8 rounded-2xl border border-black/10 px-5 py-4 dark:border-white/10">
        <p className="text-xs text-black/50 dark:text-white/50">該当件数</p>
        <p className="text-3xl font-semibold">{inquiries.length.toLocaleString()}</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-black/70 dark:text-white/70">地域別件数</h2>
        <div className="space-y-3">
          {sortedRegionCounts.map(([region, count]) => (
            <div key={region} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-black/70 dark:text-white/70">{region}</span>
              <div className="h-5 flex-1 rounded-full bg-black/5 dark:bg-white/10">
                <div
                  className="h-5 rounded-full bg-blue-600"
                  style={{ width: `${(count / maxRegionCount) * 100}%`, minWidth: "8px" }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-black/70 dark:text-white/70">
                {count.toLocaleString()}
              </span>
            </div>
          ))}
          {sortedRegionCounts.length === 0 && (
            <p className="text-sm text-black/50 dark:text-white/50">該当データがありません。</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-black/70 dark:text-white/70">一覧</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2 pr-3 font-medium text-black/50 dark:text-white/50">日時</th>
                <th className="py-2 pr-3 font-medium text-black/50 dark:text-white/50">種別</th>
                <th className="py-2 pr-3 font-medium text-black/50 dark:text-white/50">言語</th>
                <th className="py-2 pr-3 font-medium text-black/50 dark:text-white/50">国/地域</th>
                <th className="py-2 font-medium text-black/50 dark:text-white/50">内容</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                    {new Date(inquiry.created_at).toLocaleString("ja-JP")}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap">{inquiry.category}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{languageLabel(inquiry.language)}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {inquiry.members?.country ?? "-"} / {inquiry.members?.region ?? "-"}
                  </td>
                  <td className="py-2">{inquiry.message}</td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-black/50 dark:text-white/50">
                    該当データがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
