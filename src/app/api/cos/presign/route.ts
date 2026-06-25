import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateObjectKey,
  getPublicUrl,
  getPresignedUploadUrl,
  isAllowedType,
  getSizeLimit,
  VALID_CATEGORIES,
} from "@/lib/cos";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { category, contentType } = body as {
      category: string;
      contentType: string;
    };

    // 校验 category
    if (!category || !VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
      return NextResponse.json(
        { error: `无效的上传分类，支持: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // 校验 contentType
    if (!contentType || !isAllowedType(contentType)) {
      return NextResponse.json(
        { error: "不支持的图片格式，仅支持 PNG/JPEG/WebP/GIF/SVG" },
        { status: 400 }
      );
    }

    // 校验大小限制（服务端记录，客户端也有校验）
    const maxSize = getSizeLimit(category);
    if (maxSize === 0) {
      return NextResponse.json({ error: "未知的上传分类" }, { status: 400 });
    }

    // 生成对象键
    const ext = contentType === "image/jpeg" ? ".jpg" : contentType.replace("image/", ".");
    const objectKey = generateObjectKey(category, ext.replace("svg+xml", "svg"), {
      userId: user.id,
      suffix: String(Math.random().toString(36).slice(2, 8)),
    });

    // 生成预签名 URL（5 分钟有效）
    const presignedUrl = getPresignedUploadUrl(objectKey, contentType, 300);

    // 最终公开 URL
    const publicUrl = getPublicUrl(objectKey);

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      objectKey,
      maxSize,
    });
  } catch (error) {
    console.error("生成预签名 URL 失败:", error);
    return NextResponse.json({ error: "生成上传凭证失败" }, { status: 500 });
  }
}
