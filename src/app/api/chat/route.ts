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
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const { messages } = await req.json();

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error("[Chat] Key 未设置");
      return Response.json({ error: "API Key 未配置" }, { status: 500 });
    }

    // deepseek-v4-flash — 非推理模型，速度快，兼容性最好
    const result = streamText({
      model: deepseek.chat("deepseek-v4-flash" as any),
      system: process.env.AI_SYSTEM_PROMPT ?? "You are a helpful assistant.",
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    console.error("[Chat] 异常:", err?.message, err?.cause);
    return Response.json(
      {
        error: `${err?.message || "未知错误"}${
          err?.cause ? " | " + JSON.stringify(err.cause) : ""
        }`,
      },
      { status: 500 }
    );
  }
}
