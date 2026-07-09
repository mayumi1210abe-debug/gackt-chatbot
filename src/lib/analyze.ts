import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject, jsonSchema } from "ai";
import { CATEGORIES, LANGUAGES, type Category, type LanguageCode } from "@/lib/classification";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type Analysis = { category: Category; language: LanguageCode };

const analysisSchema = jsonSchema<Analysis>({
  type: "object",
  properties: {
    category: { type: "string", enum: [...CATEGORIES] },
    language: { type: "string", enum: LANGUAGES.map((l) => l.code) },
  },
  required: ["category", "language"],
  additionalProperties: false,
});

export async function analyzeMessage(text: string): Promise<Analysis> {
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
