"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

export function BackToHomeLink() {
  const router = useRouter();
  const [goBack, setGoBack] = useState(false);
  useLoadingReaction(goBack);

  useEffect(() => {
    if (goBack) {
      router.back();
    }
  }, [goBack, router]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setGoBack(true);
  }

  return (
    <>
      {goBack &&
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
        className="mb-8 inline-flex cursor-pointer items-center gap-1 text-sm text-muted transition hover:text-ink dark:text-[#9090a8] dark:hover:text-[#e0e0f0]"
      >
        ← 返回
      </span>
    </>
  );
}
