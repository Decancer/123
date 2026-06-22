"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

/** 功能卡片链接 — 点击后显示加载动画 + Mashiro 思考，再导航 */
export function FeatureCardLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className: string;
}) {
  const router = useRouter();
  const [navigateTo, setNavigateTo] = useState<string | null>(null);
  const loading = navigateTo !== null;
  useLoadingReaction(loading);

  useEffect(() => {
    if (navigateTo) {
      router.push(navigateTo);
    }
  }, [navigateTo, router]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNavigateTo(href);
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
      <a
        href={href}
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
    </>
  );
}
