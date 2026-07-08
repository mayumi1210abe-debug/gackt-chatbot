import type { UIMessage } from "ai";

export const CATEGORIES = ["予約", "料金", "クレーム", "その他"] as const;
export type Category = (typeof CATEGORIES)[number];

export type ChatMessage = UIMessage<{ category?: Category }>;
