"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

const CATEGORY_OPTIONS = [
  { key: null, label: "全部" },
  { key: "tech", label: "💻 技术" },
  { key: "life", label: "🌿 生活" },
] as const;

export function PostList({
  posts,
  total,
  page,
  totalPages,
  currentCategory,
  currentSearch,
}: {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
  currentCategory: Category | null;
  currentSearch: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch || "");

  function buildUrl(overrides: {
    category?: string | null;
    q?: string | null;
    page?: number | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    // 切换分类时清除搜索和页码
    if (overrides.category !== undefined) {
      if (overrides.category) {
        params.set("category", overrides.category);
      } else {
        params.delete("category");
      }
      params.delete("q");
      params.delete("page");
    }
    // 搜索时清除页码
    if (overrides.q !== undefined) {
      if (overrides.q) {
        params.set("q", overrides.q);
      } else {
        params.delete("q");
      }
      params.delete("page");
    }
    // 翻页
    if (overrides.page !== undefined) {
      if (overrides.page && overrides.page > 1) {
        params.set("page", String(overrides.page));
      } else {
        params.delete("page");
      }
    }
    const str = params.toString();
    return str ? `/?${str}` : "/";
  }

  function handleSearch() {
    const trimmed = searchInput.trim();
    if (trimmed === (currentSearch || "")) return; // 没变化
    router.push(buildUrl({ q: trimmed || null }));
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <>
      {/* 搜索栏 */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="搜索文章..."
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
        />
        <button
          onClick={handleSearch}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          🔍 搜索
        </button>
      </div>

      {/* 搜索结果提示 */}
      {currentSearch && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          找到 {total} 篇包含"{currentSearch}"的文章
          {total > 0 && `（第 ${page} 页）`}
        </p>
      )}

      {/* 分类 Tab */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {CATEGORY_OPTIONS.map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() =>
                router.push(buildUrl({ category: key }))
              }
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                currentCategory === key
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
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500">
            {currentSearch
              ? "未找到相关文章，试试其他关键词"
              : currentCategory
                ? "该分类下还没有文章"
                : "还没有文章，运行 npm run db:seed 创建示例数据"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
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
              <h2 className="mb-2 text-xl font-semibold leading-snug tracking-tight transition group-hover:text-blue-600 dark:group-hover:text-blue-400">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
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
            </article>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() =>
              router.push(buildUrl({ page: page - 1 }))
            }
            disabled={page <= 1}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ← 上一页
          </button>

          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            第 {page} / {totalPages} 页
          </span>

          <button
            onClick={() =>
              router.push(buildUrl({ page: page + 1 }))
            }
            disabled={page >= totalPages}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            下一页 →
          </button>
        </div>
      )}
    </>
  );
}
