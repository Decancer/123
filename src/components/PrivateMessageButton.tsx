"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

interface Props {
  userId: number;
  userName: string | null;
}

export function PrivateMessageButton({ userId, userName }: Props) {
  const router = useRouter();
  const [navigateTo, setNavigateTo] = useState<string | null>(null);
  useLoadingReaction(navigateTo !== null);

  function handleClick() {
    setNavigateTo(`/messages?to=${userId}`);
  }

  useEffect(() => {
    if (navigateTo) {
      router.push(navigateTo);
    }
  }, [navigateTo, router]);

  return (
    <>
      {navigateTo && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm">
          <img src="/mashiro.svg" alt="加载中" className="h-20 w-20 animate-spin" />
        </div>,
        document.body
      )}
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        私信 {userName}
      </button>
    </>
  );
}
