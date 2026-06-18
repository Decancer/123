"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { WriteArticleButton } from "@/components/WriteArticle";

export function WidgetArea({
  user,
}: {
  user: { id: number; name: string } | null;
}) {
  const pathname = usePathname();

  // 只在首页和文章详情页显示
  const show =
    pathname === "/" || pathname.startsWith("/posts/");

  if (!show) return null;

  return (
    <>
      {user && (
        <div className="fixed bottom-20 right-3 sm:bottom-24 sm:right-6 z-[70]">
          <WriteArticleButton />
        </div>
      )}
      <ChatWidget user={user} />
    </>
  );
}
