"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LANGUAGES, type LanguageCode } from "@/lib/classification";

export default function LanguagePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<LanguageCode | null>(null);

  useEffect(() => {
    if (selected) {
      document.cookie = `lang=${selected}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }, [selected]);

  function selectLanguage(code: LanguageCode) {
    setSelected(code);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8 px-4 py-16">
      <h1 className="text-center text-lg font-semibold">言語を選択してください</h1>

      <div className="grid w-full grid-cols-2 gap-3">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => selectLanguage(code)}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              selected === code
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-black/10 bg-transparent hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selected && (
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            新規登録
          </button>
        </div>
      )}
    </div>
  );
}
