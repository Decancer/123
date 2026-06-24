"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

export function NavHomeLink() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  useLoadingReaction(loading);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    router.push("/");
  }

  return (
    <>
      {loading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm">
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
        onClick={handleClick}
        className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 shadow-sm transition hover:bg-primary-100 hover:border-primary-300 hover:shadow-glow active:scale-95"
      >
        🏠 首页
      </Link>
    </>
  );
}
