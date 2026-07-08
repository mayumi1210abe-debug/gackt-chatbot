import type { UIMessage } from "ai";

export const CATEGORIES = ["問い合わせ", "チケット希望", "告知反応", "その他"] as const;
export type Category = (typeof CATEGORIES)[number];

export const LANGUAGES = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "yue", label: "廣東話" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "th", label: "ไทย" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export function languageLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export type ChatMessage = UIMessage<{ category?: Category; language?: LanguageCode }>;
