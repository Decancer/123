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
  const [avatar, setAvatar] = useState(user.avatar);
  const [background, setBackground] = useState(user.background);
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
          const data = await res.json();
          throw new Error(data.error || "上传失败");
        }

        const data = await res.json();
        if (field === "avatar") setAvatar(data.avatar);
        if (field === "background") setBackground(data.background);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setUploading(null);
      }
    },
    []
  );

  // 用 DiceBear 生成默认头像 URL（如果没有上传的头像）
  const avatarUrl = avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`;

  return (
    <div className="w-full">
      {/* 背景区 */}
      <div
        className="relative mb-6 h-40 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
        style={
          background
            ? {
                backgroundImage: `url(${background})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)" }
        }
      >
        <button
          onClick={() => bgInputRef.current?.click()}
          disabled={uploading === "background"}
          className="absolute bottom-2 right-2 rounded-md bg-black/40 px-2 py-1 text-xs text-white backdrop-blur transition hover:bg-black/60 disabled:opacity-50"
        >
          {uploading === "background" ? "上传中..." : "更换背景"}
        </button>
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
      <div className="relative -mt-14 mb-6 flex items-end gap-4 px-2">
        <div className="relative group">
          <img
            src={avatarUrl}
            alt="头像"
            className="h-20 w-20 rounded-full border-4 border-white bg-white object-cover shadow-md dark:border-zinc-900"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading === "avatar"}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-xs text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
          >
            {uploading === "avatar" ? "..." : "更换"}
          </button>
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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {user.name || "用户"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.bio}</p>
        </div>
      )}
    </div>
  );
}
