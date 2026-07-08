"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { ChatMessage } from "../api/chat/route";

const CATEGORY_STYLES: Record<string, string> = {
  予約: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  料金: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  クレーム: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  その他: "bg-black/10 text-black/60 dark:bg-white/15 dark:text-white/60",
};

export default function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } = useChat<ChatMessage>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col">
      <header className="border-b border-black/10 px-4 py-3 dark:border-white/10">
        <h1 className="text-lg font-semibold">チャットボット</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-black/50 dark:text-white/50">
            メッセージを送って会話を始めましょう。
          </p>
        )}

        {messages.map((message) => {
          const text = message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("");
          const category = message.metadata?.category;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
            >
              {category && (
                <span
                  className={`mb-1 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[category]}`}
                >
                  {category}
                </span>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-black/5 text-black dark:bg-white/10 dark:text-white"
                }`}
              >
                {text}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-black/5 px-4 py-2 text-sm text-black/50 dark:bg-white/10 dark:text-white/50">
              考え中…
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-red-500">
            エラーが発生しました。しばらくして再度お試しください。
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-black/10 px-4 py-3 dark:border-white/10"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-full border border-black/15 bg-transparent px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
        />
        {isBusy ? (
          <button
            type="button"
            onClick={stop}
            className="rounded-full bg-black/10 px-5 py-2 text-sm font-medium text-black transition hover:bg-black/20 dark:bg-white/15 dark:text-white"
          >
            停止
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            送信
          </button>
        )}
      </form>
    </div>
  );
}
