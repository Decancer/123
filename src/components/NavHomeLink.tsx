"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavHomeLink() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    router.push("/");
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
      <Link
        href="/"
        onClick={handleClick}
        className="hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        首页
      </Link>
    </>
  );
}
