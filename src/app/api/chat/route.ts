import { createAnthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  generateObject,
  jsonSchema,
  type ToolSet,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import { sql } from "@/lib/db";
import {
  CATEGORIES,
  LANGUAGES,
  languageLabel,
  type Category,
  type LanguageCode,
  type ChatMessage,
} from "@/lib/classification";

// ストリーミング応答のため実行時間の上限を少し伸ばす
export const maxDuration = 30;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type Analysis = { category: Category; language: LanguageCode };

const analysisSchema = jsonSchema<Analysis>({
  type: "object",
  properties: {
    category: { type: "string", enum: [...CATEGORIES] },
    language: { type: "string", enum: LANGUAGES.map((l) => l.code) },
  },
  required: ["category", "language"],
  additionalProperties: false,
});

async function analyzeMessage(text: string): Promise<Analysis> {
  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5"),
    schema: analysisSchema,
    system:
      "あなたはチャット内容を分析する担当です。ユーザーのメッセージについて、" +
      "最も当てはまるカテゴリと、書かれている言語を判定してください。",
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
