export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface ChatRequest {
  messages: Message[];
}

export interface ChatResponse {
  reply: string;
}
