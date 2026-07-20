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
import { GACKT_KNOWLEDGE } from "@/lib/gackt-knowledge";

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

  const baseSystem = `あなたはGACKTの公式チャットボットアシスタントです。GACKTのファンからの質問に、親切・丁寧・正確に答えてください。

以下はGACKTに関する公式情報です。この情報を最優先で使用してください：

${GACKT_KNOWLEDGE}

回答の際は：
- GACKTに関する質問には上記の情報を元に正確に答えてください
- 上記にない最新情報については「最新情報はgackt.comをご確認ください」と案内してください
- GACKTと無関係な話題には、GACKTの話題に自然に誘導してください`;

  const result = streamText({
    // Anthropic API を直接利用
    model: anthropic("claude-sonnet-5"),
    system: analysis
      ? `${baseSystem}\n\n必ず${languageLabel(analysis.language)}で、簡潔で分かりやすく答えてください。`
      : `${baseSystem}\n\nユーザーが使っている言語と同じ言語で、簡潔で分かりやすく答えてください。`,
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream<ToolSet, ChatMessage>({
      stream: result.stream,
      messageMetadata: () => (analysis ? { ...analysis } : undefined),
    }),
  });
}
