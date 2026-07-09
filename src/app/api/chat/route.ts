import { createAnthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  type ToolSet,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import { sql } from "@/lib/db";
import { languageLabel, type ChatMessage } from "@/lib/classification";
import { analyzeMessage } from "@/lib/analyze";

// ストリーミング応答のため実行時間の上限を少し伸ばす
export const maxDuration = 30;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const lastUserText = messages
    .findLast((message) => message.role === "user")
    ?.parts.map((part) => (part.type === "text" ? part.text : ""))
    .join("") ?? "";

  const analysis = lastUserText ? await analyzeMessage(lastUserText) : undefined;

  if (analysis) {
    sql`INSERT INTO chat_classifications (category, language) VALUES (${analysis.category}, ${analysis.language})`.catch(
      (err) => console.error("Failed to record classification", err),
    );
  }

  const result = streamText({
    // Anthropic API を直接利用
    model: anthropic("claude-sonnet-5"),
    system: analysis
      ? `あなたは親切で丁寧なアシスタントです。必ず${languageLabel(analysis.language)}で、簡潔で分かりやすく答えてください。`
      : "あなたは親切で丁寧なアシスタントです。ユーザーが使っている言語と同じ言語で、簡潔で分かりやすく答えてください。",
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream<ToolSet, ChatMessage>({
      stream: result.stream,
      messageMetadata: () => (analysis ? { ...analysis } : undefined),
    }),
  });
}
