"use client";

import { useState } from "react";

export default function MemberInquiryForm() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsBusy(true);
    try {
      const res = await fetch("/api/member/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました。");
      setCategory(data.category);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 border-t border-black/10 pt-6 dark:border-white/10">
      <h2 className="text-sm font-semibold">質問・クレームを送る</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="お問い合わせ内容を入力してください"
          className="w-full resize-none rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
        />
        <button
          type="submit"
          disabled={isBusy || !message.trim()}
          className="self-start rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          送信
        </button>
      </form>
      {category && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          送信しました(分類: {category})
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
