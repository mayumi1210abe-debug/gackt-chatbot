"use client";

import { useEffect, useState } from "react";
import { GENDERS, type RegistrationField } from "@/lib/registration";

const COUNTRIES = [
  "日本",
  "アメリカ",
  "台湾",
  "香港",
  "スペイン",
  "韓国",
  "フランス",
  "タイ",
  "その他",
];

const QUESTIONS: Record<RegistrationField, string> = {
  country: "お住まいの国はどちらですか?",
  region: "都道府県・州・地域を教えてください。",
  gender: "性別を教えてください。",
  birth_year: "生まれた年(西暦)を教えてください。",
};

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "エラーが発生しました。");
  return data;
}

export default function RegistrationChat() {
  const [nextField, setNextField] = useState<RegistrationField | null | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [showOtherCountry, setShowOtherCountry] = useState(false);

  useEffect(() => {
    fetch("/api/registration/status")
      .then((res) => res.json())
      .then((data) => setNextField(data.nextField))
      .catch(() => setError("登録状況の取得に失敗しました。"));
  }, []);

  async function answer(field: RegistrationField, value: string) {
    setError(null);
    try {
      const data = await postJson("/api/registration/answer", { field, value });
      setNextField(data.nextField);
      setTextValue("");
      setShowOtherCountry(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    }
  }

  if (nextField === "loading") {
    return <p className="text-sm text-black/50 dark:text-white/50">読み込み中…</p>;
  }

  if (nextField === null) {
    return (
      <p className="text-sm text-black/70 dark:text-white/70">
        登録情報の入力が完了しています。ようこそ!
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-sm font-medium">{QUESTIONS[nextField]}</p>

      {nextField === "country" && !showOtherCountry && (
        <div className="grid grid-cols-3 gap-2">
          {COUNTRIES.map((country) => (
            <button
              key={country}
              type="button"
              onClick={() =>
                country === "その他" ? setShowOtherCountry(true) : answer("country", country)
              }
              className="rounded-lg border border-black/10 px-3 py-2 text-sm transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              {country}
            </button>
          ))}
        </div>
      )}

      {nextField === "gender" && (
        <div className="grid grid-cols-2 gap-2">
          {GENDERS.map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() => answer("gender", gender)}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              {gender}
            </button>
          ))}
        </div>
      )}

      {(nextField === "region" ||
        nextField === "birth_year" ||
        (nextField === "country" && showOtherCountry)) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            answer(nextField, textValue);
          }}
          className="flex gap-2"
        >
          <input
            type={nextField === "birth_year" ? "number" : "text"}
            required
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={nextField === "birth_year" ? "1990" : undefined}
            className="flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
          />
          <button
            type="submit"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            送信
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
