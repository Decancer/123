"use client";

import { useState, useRef, useCallback } from "react";

interface ProfileData {
  name: string | null;
  email: string;
  avatar: string | null;
  background: string | null;
  bio: string | null;
}

export function ProfileEditor({ user }: { user: ProfileData }) {
  const [uploading, setUploading] = useState<"avatar" | "background" | null>(null);
  const [error, setError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (field: "avatar" | "background", file: File) => {
      setUploading(field);
      setError("");

      try {
        const formData = new FormData();
        formData.append(field, file);

        const res = await fetch("/api/profile", {
          method: "PATCH",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "上传失败");
        }

        // 整页刷新，确保导航栏等处的头像和背景同步更新
        window.location.reload();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setUploading(null);
      }
    },
    []
  );

  const avatarUrl = user.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`;

  return (
    <div className="w-full">
      {/* 背景区 — 整块区域可点击换背景 */}
      <div
        onClick={() => bgInputRef.current?.click()}
        className="group relative mb-6 h-40 w-full cursor-pointer overflow-hidden rounded-2xl border border-border dark:border-[#3a3a58]"
        style={
          user.background
            ? {
                backgroundImage: `url(${user.background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" }
        }
      >
        {/* 半透明提示条 — hover 时显示 */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent pb-2 pt-8 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-md bg-white/20 px-3 py-1 text-xs text-white backdrop-blur">
            {uploading === "background" ? "上传中..." : "点击更换背景"}
          </span>
        </div>
        <input
          ref={bgInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile("background", file);
            e.target.value = "";
          }}
        />
      </div>

      {/* 头像区 — 叠加在背景下缘 */}
      <div className="relative z-10 -mt-14 mb-6 flex items-end gap-4 px-2">
        <div
          onClick={() => avatarInputRef.current?.click()}
          className="group relative cursor-pointer"
        >
          <img
            src={avatarUrl}
            alt="头像"
            className="h-20 w-20 rounded-full border-4 border-surface bg-surface object-cover shadow-md dark:border-[#222240]"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-xs text-white opacity-0 transition group-hover:opacity-100">
            {uploading === "avatar" ? "..." : "更换"}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile("avatar", file);
              e.target.value = "";
            }}
          />
        </div>

        <div className="pb-1">
          <h1 className="text-xl font-bold text-ink dark:text-[#e8e8f8]">
            {user.name || "用户"}
          </h1>
          <p className="text-sm text-muted dark:text-[#a0a0c0]">
            {user.email}
          </p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-card dark:border-[#3a3a58] dark:bg-[#222240]">
          <p className="text-sm text-muted dark:text-[#a0a0c0]">{user.bio}</p>
        </div>
      )}
    </div>
  );
}
