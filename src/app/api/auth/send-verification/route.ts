import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ error: "你的邮箱已验证，无需重复验证" }, { status: 400 });
  }

  const error = await sendVerificationEmail(user.id, user.email, user.name || "用户");
  if (error) {
    return NextResponse.json({ error }, { status: 429 });
  }

  return NextResponse.json({ message: "验证邮件已发送，请查收" });
}
