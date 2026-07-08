"use client";

import { useState } from "react";

type Step = "phone" | "code" | "done";

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

export default function PhoneAuthForm() {
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isNewMember, setIsNewMember] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      await postJson("/api/auth/send-code", { phoneNumber });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const result = await postJson("/api/auth/verify-code", { phoneNumber, code });
      setIsNewMember(result.isNewMember);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setIsBusy(false);
    }
  }

  if (step === "done") {
    return (
      <p className="text-sm text-black/70 dark:text-white/70">
        {isNewMember
          ? "本人確認が完了しました。会員登録の続き(国・地域・性別・生年)は Lesson 2-4 で実装予定です。"
          : "本人確認が完了しました。おかえりなさい。"}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {step === "phone" && (
        <form onSubmit={handleSendCode} className="flex flex-col gap-3">
          <label className="text-sm text-black/70 dark:text-white/70">
            電話番号(例: +819012345678)
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+819012345678"
              className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
            />
          </label>
          <button
            type="submit"
            disabled={isBusy || !phoneNumber}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            認証コードを送信
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
          <p className="text-sm text-black/60 dark:text-white/60">
            {phoneNumber} に認証コードを送信しました(60秒有効)。
          </p>
          <label className="text-sm text-black/70 dark:text-white/70">
            認証コード(6桁)
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="mt-1 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
            />
          </label>
          <button
            type="submit"
            disabled={isBusy || code.length !== 6}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            認証する
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleSendCode}
            className="text-sm text-black/50 underline underline-offset-2 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
          >
            コードを再送信
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
