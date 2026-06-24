"use client";

import { useState, FormEvent, useCallback, useEffect } from "react";
import Link from "next/link";

const COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 未验证邮箱时的重发状态
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

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
    setUnverifiedEmail("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 403) {
        // 邮箱未验证
        setUnverifiedEmail(data.email || email);
        setError("请先验证邮箱后再登录");
        return;
      }

      if (!res.ok) {
        setError(data.error || "登录失败");
        return;
      }

      window.location.href = "/";
    } catch (err) {
      console.error("登录请求失败:", err);
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
        body: JSON.stringify({ email: unverifiedEmail }),
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
  }, [unverifiedEmail]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <img
            src="/mashiro.svg"
            alt="Mashiro"
            className="mx-auto mb-4 h-16 w-16 rounded-full shadow-glow"
          />
          <h1 className="text-2xl font-bold tracking-tight text-ink">欢迎回来</h1>
          <p className="mt-2 text-sm text-muted">
            登录以继续访问 Mashiro Chat
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6 shadow-card"
        >
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <p>{error}</p>
              {/* 未验证邮箱时显示重发按钮 */}
              {unverifiedEmail && (
                <div className="mt-2 flex items-center gap-3 border-t border-red-200 pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || resendLoading}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {resendLoading ? "发送中..." : resendCountdown > 0 ? `再次发送 (${resendCountdown}s)` : "重新发送验证邮件"}
                  </button>
                  {resendMessage && (
                    <span className="text-xs text-green-600">
                      {resendMessage}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 邮箱 */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-ink/80"
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
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* 密码 */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-ink/80"
            >
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\s/g, ""))}
              onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); } }}
              placeholder="输入密码"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>

        {/* 去注册 */}
        <p className="mt-6 text-center text-sm text-muted">
          还没有账号？{" "}
          <Link
            href="/register"
            className="font-medium text-primary-500 transition hover:text-primary-600"
          >
            立即注册
          </Link>
        </p>

        {/* 提示 */}
        <p className="mt-4 text-center text-xs text-muted/60">
          演示账号：alice@example.com / password123
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted transition hover:text-ink"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
