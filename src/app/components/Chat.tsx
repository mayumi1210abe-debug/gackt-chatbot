"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Link from "next/link";
import Image from "next/image";
import type { ChatMessage } from "@/lib/classification";
import { LANGUAGES, type LanguageCode } from "@/lib/classification";

const QUICK_ACTIONS = [
  { label: "代表作を\n教えて", message: "GACKTの代表作を教えてください" },
  { label: "問い合わせ\n方法", message: "お問い合わせ方法を教えてください" },
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [selectedLang, setSelectedLang] = useState<LanguageCode>("ja");
  const { messages, sendMessage, status, error, stop, setMessages } = useChat<ChatMessage>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  // 初回ウェルカムメッセージ
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          parts: [{ type: "text", text: "GACKT OFFICIALスタッフです。チケット・ライブ・最新情報など、お気軽にお問い合わせください。" }],
          metadata: undefined,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text, metadata: { language: selectedLang } });
    setInput("");
  }

  function handleQuickAction(message: string) {
    if (isBusy) return;
    sendMessage({ text: message, metadata: { language: selectedLang } });
  }

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* 背景画像 */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://gackt.com/s3/skiyaki/uploads/link/image/75348/GACKT_2604_Main_header_GACKTcom_A.jpg')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
      />
      {/* 暗赤色オーバーレイ */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "rgba(10,0,0,0.72)",
        }}
      />

      {/* ヘッダー */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="https://gackt.com/s3/skiyaki/uploads/link/image/12892/logo-1.png"
            alt="GACKT"
            width={90}
            height={28}
            className="object-contain brightness-0 invert"
            unoptimized
          />
          <span className="text-xs font-light tracking-[0.3em] text-white/50">AI CHAT</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold tracking-widest text-red-500 hover:text-red-400"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          DASHBOARD
        </Link>
      </header>

      {/* 言語タブ */}
      <div className="relative z-10 flex justify-center gap-1 px-4 pb-3 overflow-x-auto">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => setSelectedLang(code)}
            className={`shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium transition-all ${
              selectedLang === code
                ? "bg-red-600 text-white"
                : "border border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* チャットエリア */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-2">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((message) => {
            const text = message.parts
              .map((part) => (part.type === "text" ? part.text : ""))
              .join("");

            if (message.role === "assistant") {
              return (
                <div key={message.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white">
                    G
                  </div>
                  <div
                    className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-white/90"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    {text}
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-red-700/80 px-4 py-3 text-sm leading-relaxed text-white">
                  {text}
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white">
                G
              </div>
              <div
                className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-white/50"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                考え中…
              </div>
            </div>
          )}

          {error && (
            <p className="text-center text-xs text-red-400">
              エラーが発生しました。しばらくして再度お試しください。
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* クイックアクションボタン */}
      <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleQuickAction(action.message)}
            disabled={isBusy}
            className="rounded-xl bg-red-700 px-3 py-2 text-center text-xs font-medium leading-tight text-white shadow-lg transition hover:bg-red-600 disabled:opacity-50 whitespace-pre-line"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* 入力エリア */}
      <div className="relative z-10 border-t border-white/10 px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={() => { setTimeout(() => { isComposingRef.current = false; }, 100); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isComposingRef.current) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="スタッフへお問い合わせ..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-red-600/50"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            {isBusy ? (
              <button
                type="button"
                onClick={stop}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                ■
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-700 text-white shadow transition hover:bg-red-600 disabled:opacity-40"
              >
                ▶
              </button>
            )}
          </form>
          <p className="mt-1.5 text-center text-[10px] text-white/20">
            Shift+Enter で改行 / Enter で送信
          </p>
        </div>
      </div>
    </div>
  );
}
