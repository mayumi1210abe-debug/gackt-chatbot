import {
  streamText,
  type UIMessage,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";

// ストリーミング応答のため実行時間の上限を少し伸ばす
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    // Vercel AI Gateway 経由で Claude を利用（モデルは差し替え可能）
    model: "anthropic/claude-sonnet-5",
    system:
      "あなたは親切で丁寧な日本語のアシスタントです。ユーザーの質問に簡潔で分かりやすく答えてください。",
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
