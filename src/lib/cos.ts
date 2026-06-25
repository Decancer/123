import COS from "cos-nodejs-sdk-v5";

// 允许的图片类型
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

type AllowedType = (typeof ALLOWED_TYPES)[number];

// 各分类大小限制（字节）
const SIZE_LIMITS: Record<string, number> = {
  avatar: 500 * 1024, // 500KB
  background: 2 * 1024 * 1024, // 2MB
  "post-image": 5 * 1024 * 1024, // 5MB
};

let cosClient: COS | null = null;

function getCosClient(): COS {
  if (cosClient) return cosClient;

  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error("COS 未配置：缺少 COS_SECRET_ID 或 COS_SECRET_KEY 环境变量");
  }

  cosClient = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  });

  return cosClient;
}

/** 根据 MIME 类型获取文件扩展名 */
function getExtension(contentType: string): string {
  const map: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[contentType] || ".jpg";
}

/** 生成 COS 对象键 */
export function generateObjectKey(
  category: string,
  ext: string,
  opts?: { userId?: number; suffix?: string }
): string {
  const timestamp = Date.now();
  switch (category) {
    case "avatar":
      return `avatars/u_${opts?.userId ?? "unknown"}_${timestamp}${ext}`;
    case "background":
      return `backgrounds/u_${opts?.userId ?? "unknown"}_${timestamp}${ext}`;
    case "post-image":
      return `posts/p_${opts?.userId ?? "u"}_${timestamp}_${opts?.suffix ?? "0"}${ext}`;
    default:
      return `uploads/${category}_${timestamp}${ext}`;
  }
}

/** 校验 contentType 是否为允许的图片类型 */
export function isAllowedType(contentType: string): contentType is AllowedType {
  return ALLOWED_TYPES.includes(contentType as AllowedType);
}

/** 获取分类的大小限制 */
export function getSizeLimit(category: string): number {
  return SIZE_LIMITS[category] ?? 0;
}

/** 允许的上传分类 */
export const VALID_CATEGORIES = ["avatar", "background", "post-image"] as const;

/** 获取 COS 公开访问 URL */
export function getPublicUrl(objectKey: string): string {
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;
  return `https://${bucket}.cos.${region}.myqcloud.com/${objectKey}`;
}

/** 生成预签名上传 URL */
export function getPresignedUploadUrl(
  objectKey: string,
  contentType: string,
  expiresInSeconds: number = 300
): string {
  const cos = getCosClient();
  const bucket = process.env.COS_BUCKET!;
  const region = process.env.COS_REGION!;

  return cos.getObjectUrl({
    Bucket: bucket,
    Region: region,
    Key: objectKey,
    Method: "PUT",
    Sign: true,
    Expires: expiresInSeconds,
    Headers: {
      "Content-Type": contentType,
    },
  });
}

/** 判断字符串是否为合法的 COS URL */
export function isCosUrl(url: string): boolean {
  if (url.startsWith("data:")) return false; // 排除 base64
  const bucket = process.env.COS_BUCKET;
  return url.includes(`.cos.`) && url.includes(bucket ?? "mashiro-chat");
}

/** 判断字符串是否为 base64 data URI（过渡期兼容） */
export function isDataUri(str: string): boolean {
  return str.startsWith("data:image/");
}

/** 校验图片字符串：COS URL 或 base64 data URI 均接受（过渡期） */
export function isValidImageValue(img: unknown): img is string {
  if (typeof img !== "string" || !img.trim()) return false;
  return isCosUrl(img) || isDataUri(img);
}
