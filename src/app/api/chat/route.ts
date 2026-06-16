import { streamText, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCurrentUser } from "@/lib/auth";

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
      return Response.json({ error: "API Key 未配置" }, { status: 500 });
    }

    // AI SDK v6 useChat 发来 parts 格式，需转为 content 格式给 DeepSeek
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: deepseek.chat("deepseek-v4-flash" as any),
      system: process.env.AI_SYSTEM_PROMPT ?? "You are a helpful assistant.",
      messages: modelMessages,
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
