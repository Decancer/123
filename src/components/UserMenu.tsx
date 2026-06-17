"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface UserMenuProps {
  userName: string;
  avatar: string | null;
}

export function UserMenu({ userName, avatar }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"logout" | "delete" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowConfirm(false);
        setShowLogoutConfirm(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // 退出登录（二次确认）
  async function handleLogout() {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      return;
    }

    setLoading("logout");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch {
      setLoading(null);
    }
  }

  // 注销账号
  async function handleDeleteAccount() {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading("delete");
    try {
      const res = await fetch("/api/auth/delete", { method: "POST" });
      if (res.ok) {
        router.push("/");
      }
    } catch {
      setLoading(null);
    }
  }

  const initial = userName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div ref={menuRef} className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => { setOpen(!open); setShowConfirm(false); setShowLogoutConfirm(false); }}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {initial}
          </span>
        )}
        <span className="hidden text-zinc-700 dark:text-zinc-300 sm:inline">
          {userName}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {/* 用户信息 */}
          <div className="border-b border-zinc-100 px-4 py-2 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {userName}
            </p>
          </div>

          {/* 个人主页 */}
          <button
            onClick={() => { router.push("/profile"); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            个人主页
          </button>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            disabled={loading === "logout"}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {loading === "logout" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
            {showLogoutConfirm ? "确认退出？" : "退出登录"}
          </button>

          {/* 注销账号 */}
          <button
            onClick={handleDeleteAccount}
            disabled={loading === "delete"}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
          >
            {loading === "delete" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {showConfirm ? "确认注销？数据不可恢复" : "注销账号"}
          </button>
        </div>
      )}
    </div>
  );
}
