"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent, useCallback, useEffect } from "react";
import Link from "next/link";

const COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 注册成功后显示验证提示
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  // 倒计时
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

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

      // 注册成功，显示验证提示
      setRegistered(true);
      setRegisteredEmail(data.email);
      setResendMessage(data.message);
    } catch (err) {
      console.error("注册请求失败:", err);
      setError("网络错误，请检查服务是否启动");
    } finally {
      setLoading(false);
    }
  }

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setResendMessage("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setResendCountdown(COOLDOWN_SECONDS);
        setResendMessage(data.message || "验证邮件已发送，请查收");
      } else {
        setResendMessage(data.error || "发送失败");
      }
    } catch {
      setResendMessage("网络错误，请重试");
    } finally {
      setResendLoading(false);
    }
  }, [registeredEmail]);

  // 注册成功后显示的验证提示页面
  if (registered) {
    const canResend = resendCountdown === 0 && !resendLoading;
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 dark:bg-[#0f0f1e]">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-[#e0e0f0]">注册成功</h1>
          <p className="mt-3 text-muted dark:text-[#9090a8]">
            验证邮件已发送至
          </p>
          <p className="font-medium text-ink dark:text-[#e0e0f0]">
            {registeredEmail}
          </p>
          <p className="mt-2 text-sm text-muted/80 dark:text-[#9090a8]/80">
            请查收邮件并点击验证链接，完成后即可登录
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={!canResend}
              className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow disabled:opacity-50 dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300"
            >
              {resendLoading ? "发送中..." : resendCountdown > 0 ? `再次发送 (${resendCountdown}s)` : "重新发送验证邮件"}
            </button>
            {resendMessage && (
              <span className="text-sm text-green-600 dark:text-green-400">
                {resendMessage}
              </span>
            )}
          </div>

          <div className="mt-10">
            <Link
              href="/login"
              className="inline-block rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 dark:bg-[#0f0f1e]">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <img
            src="/mashiro.svg"
            alt="Mashiro"
            className="mx-auto mb-4 h-16 w-16 rounded-full shadow-glow"
          />
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-[#e0e0f0]">创建账号</h1>
          <p className="mt-2 text-sm text-muted dark:text-[#9090a8]">
            注册后即可开始使用 Mashiro Chat
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-card dark:border-[#2a2a45] dark:bg-[#1a1a30]"
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-[#e0e0f0]/80"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-[#2a2a45] dark:bg-[#0f0f1e] dark:text-[#e0e0f0] dark:focus:border-primary-400"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-[#e0e0f0]/80"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-[#2a2a45] dark:bg-[#0f0f1e] dark:text-[#e0e0f0] dark:focus:border-primary-400"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-[#e0e0f0]/80"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-[#2a2a45] dark:bg-[#0f0f1e] dark:text-[#e0e0f0] dark:focus:border-primary-400"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-ink/80 dark:text-[#e0e0f0]/80"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-[#2a2a45] dark:bg-[#0f0f1e] dark:text-[#e0e0f0] dark:focus:border-primary-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300"
          >
            {loading ? "注册中..." : "注 册"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted dark:text-[#9090a8]">
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium text-primary-500 transition hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
          >
            立即登录
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted transition hover:text-ink dark:text-[#9090a8] dark:hover:text-[#e0e0f0]"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
