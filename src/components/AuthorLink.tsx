"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

export function AuthorLink({
  userId,
  name,
  avatar,
  size = "sm",
}: {
  userId: number;
  name: string;
  avatar: string | null;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [navigateTo, setNavigateTo] = useState<string | null>(null);
  const loading = navigateTo !== null;
  useLoadingReaction(loading);

  // 等 React 渲染出 Portal 后再导航
  useEffect(() => {
    if (navigateTo) {
      router.push(navigateTo);
    }
  }, [navigateTo, router]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    setNavigateTo(`/users/${userId}`);
  }

  const avatarSize = size === "md" ? "h-9 w-9" : "h-5 w-5";
  const initialsSize = size === "md" ? "text-sm" : "text-[10px]";

  return (
    <>
      {loading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm dark:bg-[#0f0f1e]/80">
            <img
              src="/mashiro.svg"
              alt="加载中"
              className="h-20 w-20 animate-spin"
            />
          </div>,
          document.body
        )}
      <span
        onClick={handleClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleClick(e as unknown as React.MouseEvent);
        }}
        className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-ink/80 transition hover:text-primary-500 dark:text-[#e0e0f0]/80 dark:hover:text-primary-400"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className={`${avatarSize} rounded-full object-cover ring-1 ring-primary-100 dark:ring-primary-500/20`}
          />
        ) : (
          <span
            className={`inline-flex ${avatarSize} items-center justify-center rounded-full bg-primary-500 ${initialsSize} font-semibold text-white`}
          >
            {name.charAt(0) || "?"}
          </span>
        )}
        <span className="group-hover:underline underline-offset-2">
          {name}
        </span>
      </span>
    </>
  );
}
