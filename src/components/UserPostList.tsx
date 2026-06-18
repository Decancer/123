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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
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
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-400">暂无已发布文章</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              onClick={() => setLoadingPath(post.slug)}
              className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
            >
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    post.category === "life"
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  }`}
                >
                  {post.category === "life" ? "🌿 生活" : "💻 技术"}
                </span>
              </div>
              <h3 className="mb-1.5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-400">
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
