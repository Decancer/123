"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // 前端校验
    if (!name.trim()) {
      setError("请输入昵称");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 个字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        return;
      }

      // 注册成功（已自动登录），跳转首页
      router.push("/");
    } catch (err) {
      console.error("注册请求失败:", err);
      setError("网络错误，请检查服务是否启动");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo & 标题 */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-5xl">✨</div>
          <h1 className="text-2xl font-bold tracking-tight">创建账号</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            注册后即可开始使用 My Blog
          </p>
        </div>

        {/* 表单卡片 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* 昵称 */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              昵称
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的昵称"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-400"
            />
          </div>

          {/* 邮箱 */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-400"
            />
          </div>

          {/* 密码 */}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 个字符"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-400"
            />
          </div>

          {/* 确认密码 */}
          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-400"
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "注册中..." : "注 册"}
          </button>
        </form>

        {/* 去登录 */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
          >
            立即登录
          </Link>
        </p>

        <div className="mt-6 text-center">
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
