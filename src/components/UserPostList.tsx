"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

interface PostSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  viewCount: number;
  createdAt: Date | string;
  _count: { comments: number };
}

export function UserPostList({ posts }: { posts: PostSummary[] }) {
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  useLoadingReaction(loadingPath !== null);

  return (
    <>
      {loadingPath && (
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm dark:bg-[#16162a]/80">
            <img
              src="/mashiro.svg"
              alt="加载中"
              className="h-20 w-20 animate-spin"
            />
          </div>,
          document.body
        )
      )}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 p-12 text-center dark:border-[#3a3a58]">
          <p className="text-muted dark:text-[#a0a0c0]">暂无已发布文章</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              onClick={() => setLoadingPath(post.slug)}
              className="block rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary-300 active:scale-[0.98] dark:border-[#3a3a58] dark:bg-[#222240] dark:hover:border-primary-500"
            >
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                    post.category === "life"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                  }`}
                >
                  {post.category === "life" ? "🌿 生活" : "💻 技术"}
                </span>
              </div>
              <h3 className="mb-1.5 text-lg font-semibold text-ink dark:text-[#e8e8f8]">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mb-3 text-sm text-muted dark:text-[#a0a0c0]">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted/70 dark:text-[#a0a0c0]/70">
                <time dateTime={new Date(post.createdAt).toISOString()}>
                  {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                </time>
                <span>·</span>
                <span>{post._count.comments} 条评论</span>
                <span>·</span>
                <span>{post.viewCount} 次阅读</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
