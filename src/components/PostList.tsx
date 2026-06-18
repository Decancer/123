"use client";

import { useState } from "react";
import Link from "next/link";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

type Category = "tech" | "life";

interface PostAuthor {
  id: number;
  name: string | null;
  avatar: string | null;
}

interface PostTag {
  tag: {
    id: number;
    name: string;
  };
}

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  viewCount: number;
  createdAt: Date | string;
  author: PostAuthor;
  tags: PostTag[];
  _count: { comments: number };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("zh-CN");
}

export function PostList({
  posts,
  initialCategory,
}: {
  posts: Post[];
  initialCategory: Category | null;
}) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(initialCategory);
  const [loading, setLoading] = useState(false);
  useLoadingReaction(loading);

  const filtered =
    activeCategory === null
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* 全屏加载动画 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
          <img
            src="/mashiro.svg"
            alt="加载中"
            className="h-20 w-20 animate-spin"
          />
        </div>
      )}

      {/* 分类 Tab */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {([
            { key: null, label: "全部" },
            { key: "tech", label: "💻 技术" },
            { key: "life", label: "🌿 生活" },
          ] as const).map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() => setActiveCategory(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 文章列表 */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">
            {activeCategory === null
              ? "还没有文章，运行 npm run db:seed 创建示例数据"
              : "该分类下还没有文章"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              onClick={() => setLoading(true)}
              className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition active:scale-[0.98] hover:shadow-md hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
            >
              {/* 分区徽章 + 标签 */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    post.category === "life"
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  }`}
                >
                  {post.category === "life" ? "🌿 生活" : "💻 技术"}
                </span>
                {post.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* 标题 */}
              <h2 className="mb-2 text-xl font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
                {post.title}
              </h2>

              {/* 摘要 */}
              {post.excerpt && (
                <p className="mb-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {post.excerpt}
                </p>
              )}

              {/* 底部信息 */}
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                    {post.author.name?.charAt(0) || "?"}
                  </span>
                )}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {post.author.name}
                </span>
                <span aria-hidden="true">·</span>
                <span>{post._count.comments} 条评论</span>
                <span aria-hidden="true">·</span>
                <span>{post.viewCount} 次阅读</span>
                <span aria-hidden="true">·</span>
                <time dateTime={new Date(post.createdAt).toISOString()}>
                  {formatDate(post.createdAt)}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}

    </>
  );
}
