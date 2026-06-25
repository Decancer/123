import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isCosUrl, isDataUri } from "@/lib/cos";

// 过渡期兼容：COS URL 或 base64 data URI 均接受
function isValidImageValue(val: unknown): val is string {
  if (typeof val !== "string" || !val.trim()) return false;
  return isCosUrl(val) || isDataUri(val);
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 尝试 JSON（新方式：COS URL），回退到 FormData（旧方式：base64）
    const contentType = request.headers.get("content-type") || "";
    const updates: Record<string, string | null> = {};

    if (contentType.includes("application/json")) {
      const { avatar, background } = await request.json();

      // 头像
      if (avatar !== undefined) {
        if (avatar === null) {
          updates.avatar = null;
        } else if (isValidImageValue(avatar)) {
          updates.avatar = avatar;
        } else if (typeof avatar === "string" && avatar.trim()) {
          return NextResponse.json({ error: "无效的头像地址，仅支持 COS URL 或 data URI" }, { status: 400 });
        }
      }

      // 背景
      if (background !== undefined) {
        if (background === null) {
          updates.background = null;
        } else if (isValidImageValue(background)) {
          updates.background = background;
        } else if (typeof background === "string" && background.trim()) {
          return NextResponse.json({ error: "无效的背景地址，仅支持 COS URL 或 data URI" }, { status: 400 });
        }
      }
    } else {
      // 兼容旧版 FormData 上传（逐步废弃）
      const formData = await request.formData();
      const avatarFile = formData.get("avatar") as File | null;
      const bgFile = formData.get("background") as File | null;

      if (avatarFile && avatarFile.size > 0) {
        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        updates.avatar = `data:${avatarFile.type};base64,${buffer.toString("base64")}`;
      }
      if (bgFile && bgFile.size > 0) {
        const buffer = Buffer.from(await bgFile.arrayBuffer());
        updates.background = `data:${bgFile.type};base64,${buffer.toString("base64")}`;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "没有需要更新的内容" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
      select: { id: true, avatar: true, background: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("上传失败:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
