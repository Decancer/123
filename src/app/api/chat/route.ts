import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCurrentUser } from "@/lib/auth";

// DeepSeek 兼容 OpenAI API
const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 鉴权
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!process.env.DEEPSEEK_API_KEY) {
      return Response.json(
        { error: "AI API Key 未配置，请在 Vercel 环境变量中设置 DEEPSEEK_API_KEY 并重新部署" },
        { status: 500 }
      );
    }

    const result = streamText({
      model: deepseek("deepseek-chat"),
      system: process.env.AI_SYSTEM_PROMPT ?? "You are a helpful assistant.",
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("AI Chat 错误:", err);
    return Response.json(
      { error: `AI 服务异常: ${err instanceof Error ? err.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
