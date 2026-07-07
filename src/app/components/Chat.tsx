"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatResponse, Message } from "@/app/types";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: createId(), role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "エラーが発生しました。",
      );
    } finally {
      setLoading(false);
    }
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

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-black/5 text-black dark:bg-white/10 dark:text-white"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-black/5 px-4 py-2 text-sm text-black/50 dark:bg-white/10 dark:text-white/50">
              入力中…
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-black/10 px-4 py-3 dark:border-white/10"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-full border border-black/15 bg-transparent px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </div>
  );
}
