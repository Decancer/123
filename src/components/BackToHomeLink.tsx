"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

export function BackToHomeLink() {
  const [loading, setLoading] = useState(false);
  useLoadingReaction(loading);

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
      <Link
        href="/"
        onClick={() => setLoading(true)}
        className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← 返回首页
      </Link>
    </>
  );
}
