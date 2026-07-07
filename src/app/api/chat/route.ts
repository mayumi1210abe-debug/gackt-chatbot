import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/app/types";

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  // --- ここを実際のLLM呼び出しに差し替えてください ---
  // 例: Vercel AI Gateway / AI SDK を使う場合は generateText() などに置き換える。
  // 現状は動作確認用のエコー応答を返します。
  const reply = lastUserMessage
    ? `「${lastUserMessage.content}」というメッセージを受け取りました。`
    : "何かメッセージを送ってください。";
  // ----------------------------------------------------

  const response: ChatResponse = { reply };
  return NextResponse.json(response);
}
