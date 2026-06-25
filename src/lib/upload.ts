/**
 * 客户端工具：前端直传 COS
 *
 * 流程：调 presign API 拿预签名 URL → PUT 直传 COS → 返回公开 URL
 * 服务器不接触图片字节
 */

interface PresignResponse {
  presignedUrl: string;
  publicUrl: string;
  objectKey: string;
  maxSize: number;
}

/** 上传文件到 COS，返回公开访问 URL */
export async function uploadToCos(
  file: File,
  category: "avatar" | "background" | "post-image"
): Promise<string> {
  // 1. 请求预签名 URL
  const presignRes = await fetch("/api/cos/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, contentType: file.type }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: "获取上传凭证失败" }));
    throw new Error(err.error || "获取上传凭证失败");
  }

  const { presignedUrl, publicUrl, maxSize }: PresignResponse =
    await presignRes.json();

  // 2. 客户端二次校验大小（presign API 也会校验）
  if (maxSize > 0 && file.size > maxSize) {
    const limitMB = (maxSize / 1024 / 1024).toFixed(1);
    throw new Error(`文件超过 ${limitMB}MB 限制`);
  }

  // 3. PUT 直传 COS
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(
      `上传失败 (${uploadRes.status}): ${await uploadRes.text().catch(() => "")}`
    );
  }

  return publicUrl;
}
