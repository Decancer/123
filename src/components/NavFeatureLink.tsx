"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

export function NavFeatureLink() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  useLoadingReaction(loading);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    router.push("/features");
  }

  return (
    <>
      {loading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm dark:bg-[#16162a]/80">
            <img
              src="/mashiro.svg"
              alt="加载中"
              className="h-20 w-20 animate-spin"
            />
          </div>,
          document.body
        )}
      <Link
        href="/features"
        onClick={handleClick}
        className="text-muted hover:text-ink dark:text-[#a0a0c0] dark:hover:text-[#e8e8f8]"
      >
        功能
      </Link>
    </>
  );
}
