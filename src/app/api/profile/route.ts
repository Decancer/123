import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const MAX_AVATAR = 500 * 1024;   // 500KB
const MAX_BACKGROUND = 2 * 1024 * 1024; // 2MB

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const avatarFile = formData.get("avatar") as File | null;
    const bgFile = formData.get("background") as File | null;

    const updates: Record<string, string | null> = {};

    // 处理头像
    if (avatarFile && avatarFile.size > 0) {
      if (!ALLOWED_TYPES.includes(avatarFile.type)) {
        return NextResponse.json({ error: "头像仅支持 PNG/JPEG/WebP/GIF/SVG" }, { status: 400 });
      }
      if (avatarFile.size > MAX_AVATAR) {
        return NextResponse.json({ error: "头像不能超过 500KB" }, { status: 400 });
      }
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const mime = avatarFile.type;
      updates.avatar = `data:${mime};base64,${buffer.toString("base64")}`;
    }

    // 处理背景
    if (bgFile && bgFile.size > 0) {
      if (!ALLOWED_TYPES.includes(bgFile.type)) {
        return NextResponse.json({ error: "背景仅支持 PNG/JPEG/WebP/GIF/SVG" }, { status: 400 });
      }
      if (bgFile.size > MAX_BACKGROUND) {
        return NextResponse.json({ error: "背景不能超过 2MB" }, { status: 400 });
      }
      const buffer = Buffer.from(await bgFile.arrayBuffer());
      const mime = bgFile.type;
      updates.background = `data:${mime};base64,${buffer.toString("base64")}`;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "没有上传任何文件" }, { status: 400 });
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
