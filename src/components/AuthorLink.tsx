"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
  const [loading, setLoading] = useState(false);
  useLoadingReaction(loading);

  const avatarSize = size === "md" ? "h-9 w-9" : "h-5 w-5";
  const fontSize = size === "md" ? "text-sm" : "text-sm";
  const initialsSize = size === "md" ? "text-sm" : "text-[10px]";

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
        href={`/users/${userId}`}
        onClick={(e) => {
          e.stopPropagation();
          setLoading(true);
        }}
        className={`inline-flex items-center gap-1.5 font-medium transition hover:text-blue-600 group`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className={`${avatarSize} rounded-full object-cover`}
          />
        ) : (
          <span
            className={`inline-flex ${avatarSize} items-center justify-center rounded-full bg-blue-500 ${initialsSize} font-semibold text-white`}
          >
            {name.charAt(0) || "?"}
          </span>
        )}
        <span className="group-hover:underline underline-offset-2">
          {name}
        </span>
      </Link>
    </>
  );
}
