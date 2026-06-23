import { verifyEmailToken } from "@/lib/email";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  // 没有 token，显示提示
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 dark:bg-[#16162a]">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-[#e8e8f8]">验证你的邮箱</h1>
          <p className="mt-3 text-muted dark:text-[#a0a0c0]">
            我们已向你的注册邮箱发送了一封验证邮件，
            <br />
            请点击邮件中的链接完成验证。
          </p>
          <p className="mt-4 text-sm text-muted/70 dark:text-[#a0a0c0]/70">
            没有收到邮件？检查垃圾箱，或{" "}
            <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300">
              登录
            </Link>
            {" "}后重新发送。
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="text-sm text-muted transition hover:text-ink dark:text-[#a0a0c0] dark:hover:text-[#e8e8f8]"
            >
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 有 token，执行验证
  const result = await verifyEmailToken(token);

  if ("error" in result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 dark:bg-[#16162a]">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">❌</div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-[#e8e8f8]">验证失败</h1>
          <p className="mt-3 text-muted dark:text-[#a0a0c0]">
            {result.error}
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="inline-block rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow dark:bg-primary-400 dark:text-[#16162a] dark:hover:bg-primary-300"
            >
              去登录
            </Link>
            <br />
            <Link
              href="/"
              className="text-sm text-muted transition hover:text-ink dark:text-[#a0a0c0] dark:hover:text-[#e8e8f8]"
            >
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 验证成功
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 dark:bg-[#16162a]">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-[#e8e8f8]">邮箱验证成功</h1>
        <p className="mt-3 text-muted dark:text-[#a0a0c0]">
          你的邮箱已验证，可以返回原页面继续操作。
        </p>
      </div>
    </div>
  );
}
