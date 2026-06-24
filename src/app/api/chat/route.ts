import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const searchPosts = tool({
  description:
    "搜索 Mashiro Chat 博客中的文章。可按关键词、作者名、分类组合筛选。用户问「有哪些XXX文章」「XXX写了什么」「搜XXX的文章」「Deca写了什么」时调用。注意：keyword 和 authorName 至少提供一个。",
  inputSchema: z.object({
    keyword: z.string().optional().describe("搜索关键词，匹配标题和内容。仅按作者搜时可不传"),
    category: z.enum(["tech", "life"]).optional().describe("按分类筛选：tech 技术 / life 生活"),
    authorName: z.string().optional().describe("按作者名筛选，匹配用户昵称。搜某人文章时使用"),
  }),
  execute: async ({ keyword, category, authorName }) => {
    // 动态构建 WHERE 条件
    const AND: Record<string, unknown>[] = [{ published: true }];

    // 关键词搜索：匹配标题或内容
    if (keyword && keyword.trim()) {
      AND.push({
        OR: [
          { title: { contains: keyword.trim() } },
          { content: { contains: keyword.trim() } },
        ],
      });
    }

    // 分类筛选
    if (category) {
      AND.push({ category });
    }

    // 作者名筛选
    if (authorName && authorName.trim()) {
      AND.push({ author: { name: { contains: authorName.trim() } } });
    }

    // 至少需要 keyword 或 authorName 之一（没有筛选条件就搜最近文章）
    if ((!keyword || !keyword.trim()) && (!authorName || !authorName.trim())) {
      // 无条件时返回最近文章
    }

    const posts = await prisma.post.findMany({
      where: { AND },
      select: {
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    if (posts.length === 0) {
      return "没有找到相关文章喵~";
    }

    return posts
      .map(
        (p) =>
          `【${p.category === "tech" ? "技术" : "生活"}】${p.title}\n摘要：${p.excerpt || p.content.slice(0, 200)}\n日期：${p.createdAt.toISOString().slice(0, 10)}\n作者：${p.author.name}\n链接：/posts/${p.slug}`
      )
      .join("\n\n");
  },
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

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: deepseek.chat("deepseek-v4-flash" as any),
      system: process.env.AI_SYSTEM_PROMPT ?? "You are a helpful assistant.",
      messages: modelMessages,
      tools: { searchPosts },
      toolChoice: "auto",
      stopWhen: stepCountIs(3),
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
