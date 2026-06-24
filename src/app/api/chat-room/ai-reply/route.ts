import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const AI_USER_ID = 0;
const AI_USER_NAME = "Mashiro";
const AI_USER_AVATAR = "/mashiro.svg";
const CONTEXT_LIMIT = 30;

export async function POST(_request: NextRequest) {
  try {
    // 需登录才能召唤 AI
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    // 取最近 N 条消息作为上下文
    const recentMessages = await prisma.chatRoomMessage.findMany({
      orderBy: { id: "desc" },
      take: CONTEXT_LIMIT,
      select: { userName: true, content: true },
    });
    recentMessages.reverse();

    if (recentMessages.length === 0) {
      const fallback = await createAiMessage("大家怎么都不说话呀…那我先来暖暖场吧～今天天气真好呢 ☀️");
      return NextResponse.json(fallback, { status: 201 });
    }

    // 构建聊天记录文本
    const chatLog = recentMessages
      .map((m) => `${m.userName}: ${m.content}`)
      .join("\n");

    const systemPrompt =
      process.env.AI_SYSTEM_PROMPT ||
      "你是 Mashiro，一只可爱的猫娘。你友好、活泼、偶尔撒娇。";

    const userPrompt = `以下是聊天室的最近聊天记录：

${chatLog}

---
请以 Mashiro（猫娘）的身份，根据上面的聊天内容说一句话回复。要求：
- 用中文回复
- 1-2 句话，简短自然，像在群聊里插话
- 根据上文内容进行思考，回复要有针对性
- 语气轻松可爱但不过分卖萌`;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI 未配置" }, { status: 500 });
    }

    const aiRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!aiRes.ok) {
      console.error("DeepSeek API 错误:", aiRes.status, await aiRes.text());
      return NextResponse.json({ error: "AI 请求失败" }, { status: 500 });
    }

    const aiData = await aiRes.json();
    const aiContent =
      aiData.choices?.[0]?.message?.content?.trim() || "喵…我不知道说什么好～";

    const message = await createAiMessage(aiContent);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("AI 回复失败:", error);
    return NextResponse.json({ error: "AI 回复失败" }, { status: 500 });
  }
}

async function createAiMessage(content: string) {
  return prisma.chatRoomMessage.create({
    data: {
      content,
      userId: AI_USER_ID,
      userName: AI_USER_NAME,
      userAvatar: AI_USER_AVATAR,
    },
  });
}
