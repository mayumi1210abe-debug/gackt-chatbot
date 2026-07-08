import Link from "next/link";
import { cookies } from "next/headers";
import { languageLabel } from "@/lib/classification";
import PhoneAuthForm from "@/app/components/PhoneAuthForm";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">ログイン</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        選択言語: {lang ? languageLabel(lang) : "未選択"}
      </p>
      <PhoneAuthForm />
      <Link
        href="/entry"
        className="text-sm text-black/50 underline underline-offset-2 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
      >
        言語選択に戻る
      </Link>
    </div>
  );
}
