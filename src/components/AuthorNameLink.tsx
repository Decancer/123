"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

/** 作者名链接 — 轻量版，仅包文字，用于非卡片布局场景 */
export function AuthorNameLink({
  userId,
  name,
  className,
}: {
  userId: number;
  name: string;
  className?: string;
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
    e.preventDefault();
    e.stopPropagation();
    setNavigateTo(`/users/${userId}`);
  }

  return (
    <>
      {loading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
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
        className={`cursor-pointer transition hover:text-blue-600 hover:underline ${className ?? ""}`}
      >
        {name}
      </span>
    </>
  );
}
