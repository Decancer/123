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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm dark:bg-[#0f0f1e]/80">
          <img
            src="/mashiro.svg"
            alt="加载中"
            className="h-20 w-20 animate-spin"
          />
        </div>
      )}

      {/* 分类 Tab */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-1 rounded-xl bg-primary-100/50 p-1 dark:bg-[#1a1a35]">
          {([
            { key: null, label: "全部" },
            { key: "tech", label: "💻 技术" },
            { key: "life", label: "🌿 生活" },
          ] as const).map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() => setActiveCategory(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === key
                  ? "bg-surface text-ink shadow-card dark:bg-[#2a2a45] dark:text-[#e0e0f0]"
                  : "text-muted hover:text-ink dark:text-[#9090a8] dark:hover:text-[#e0e0f0]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 文章列表 */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 p-12 text-center dark:border-[#2a2a45]">
          <p className="text-muted dark:text-[#9090a8]">
            {activeCategory === null
              ? "还没有文章，运行 npm run db:seed 创建示例数据"
              : "该分类下还没有文章"}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              onClick={() => setLoading(true)}
              className="group block rounded-2xl border border-border bg-surface p-6 shadow-card transition-all duration-300 active:scale-[0.98] hover:shadow-card-hover hover:border-primary-300 dark:border-[#2a2a45] dark:bg-[#1a1a30] dark:hover:border-primary-500"
            >
              {/* 分区徽章 + 标签 */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                    post.category === "life"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                  }`}
                >
                  {post.category === "life" ? "🌿 生活" : "💻 技术"}
                </span>
                {post.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-[#2a2a45] dark:text-primary-300"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* 标题 */}
              <h2 className="mb-2 text-xl font-semibold leading-snug tracking-tight text-ink group-hover:text-primary-600 transition-colors dark:text-[#e0e0f0] dark:group-hover:text-primary-400">
                {post.title}
              </h2>

              {/* 摘要 */}
              {post.excerpt && (
                <p className="mb-4 leading-relaxed text-muted dark:text-[#9090a8]">
                  {post.excerpt}
                </p>
              )}

              {/* 底部信息 */}
              <div className="flex items-center gap-2 text-sm text-muted/80 dark:text-[#9090a8]/80">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-semibold text-white">
                    {post.author.name?.charAt(0) || "?"}
                  </span>
                )}
                <span className="font-medium text-ink/80 dark:text-[#e0e0f0]/80">
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
