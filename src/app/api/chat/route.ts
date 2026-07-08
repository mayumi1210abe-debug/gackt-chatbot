import { createAnthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  generateObject,
  type ToolSet,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import { sql } from "@/lib/db";
import { CATEGORIES, type Category, type ChatMessage } from "@/lib/classification";

// ストリーミング応答のため実行時間の上限を少し伸ばす
export const maxDuration = 30;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function classifyMessage(text: string): Promise<Category> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5"),
    output: "enum",
    enum: [...CATEGORIES],
    system:
      "あなたはチャット内容を分類する担当です。ユーザーのメッセージ内容から最も当てはまるカテゴリを1つ選んでください。",
    prompt: text,
  });
  return object;
}

export async function POST(req: Request) {
  const { messages }: { messages: ChatMessage[] } = await req.json();

  const lastUserText = messages
    .findLast((message) => message.role === "user")
    ?.parts.map((part) => (part.type === "text" ? part.text : ""))
    .join("") ?? "";

  const category = lastUserText ? await classifyMessage(lastUserText) : undefined;

  if (category) {
    sql`INSERT INTO chat_classifications (category) VALUES (${category})`.catch(
      (err) => console.error("Failed to record classification", err),
    );
  }

  const result = streamText({
    // Anthropic API を直接利用
    model: anthropic("claude-sonnet-5"),
    system:
      "あなたは親切で丁寧な日本語のアシスタントです。ユーザーの質問に簡潔で分かりやすく答えてください。",
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream<ToolSet, ChatMessage>({
      stream: result.stream,
      messageMetadata: () => (category ? { category } : undefined),
    }),
  });
}
