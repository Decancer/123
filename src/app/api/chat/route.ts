import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCurrentUser } from "@/lib/auth";

// DeepSeek 兼容 OpenAI API，只需改 baseURL
const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  // 鉴权
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: process.env.AI_SYSTEM_PROMPT ?? "You are a helpful assistant.",
    messages,
  });

  return result.toUIMessageStreamResponse();
}
