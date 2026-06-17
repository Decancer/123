"use client";

import { useState, useEffect, useCallback } from "react";

const COOLDOWN_SECONDS = 60;

export function EmailVerificationBanner() {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleResend = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setCountdown(COOLDOWN_SECONDS);
      } else {
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  const isDisabled = loading || countdown > 0;

  let buttonText = "重新发送验证邮件";
  if (loading) {
    buttonText = "发送中...";
  } else if (countdown > 0) {
    buttonText = `再次发送 (${countdown}s)`;
  }

  return (
    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl">📧</span>
        <div className="flex-1">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            邮箱尚未验证
          </p>
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            验证邮箱后才能正常使用博客功能。请检查收件箱（含垃圾箱），或重新发送验证邮件。
          </p>

          {/* 按钮区 */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleResend}
              disabled={isDisabled}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
            >
              {buttonText}
            </button>

            {countdown > 0 && (
              <span className="text-sm text-green-600 dark:text-green-400">
                ✓ 已发送，请查收
              </span>
            )}
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
