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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="text-2xl font-bold tracking-tight">验证你的邮箱</h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            我们已向你的注册邮箱发送了一封验证邮件，
            <br />
            请点击邮件中的链接完成验证。
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            没有收到邮件？检查垃圾箱，或{" "}
            <Link href="/login" className="text-blue-500 hover:text-blue-600">
              登录
            </Link>
            {" "}后重新发送。
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">❌</div>
          <h1 className="text-2xl font-bold tracking-tight">验证失败</h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            {result.error}
          </p>
          <div className="mt-8 space-y-3">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              去登录
            </Link>
            <br />
            <Link
              href="/"
              className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h1 className="text-2xl font-bold tracking-tight">邮箱验证成功</h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          你的邮箱已验证，可以返回原页面继续操作。
        </p>
      </div>
    </div>
  );
}
