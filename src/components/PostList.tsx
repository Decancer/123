"use client";

import { useState } from "react";
import Link from "next/link";
import { EditPostForm } from "@/components/EditPostForm";

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
  currentUserId,
}: {
  posts: Post[];
  initialCategory: Category | null;
  currentUserId?: number;
}) {
  const [activeCategory, setActiveCategory] = useState<Category | null>(initialCategory);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered =
    activeCategory === null
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  async function handleDelete(postId: number) {
    setDeleting(true);
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      await fetch(`/api/posts/${post.slug}`, { method: "DELETE" });
      window.location.reload();
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  }

  return (
    <>
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
            <article
              key={post.id}
              className="group relative rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* 编辑/删除按钮（仅作者可见） */}
              {currentUserId === post.author.id && (
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-700 dark:hover:text-blue-400"
                    title="编辑"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {deleteConfirm === post.id ? (
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting}
                      className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-600"
                    >
                      {deleting ? "..." : "确定"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-700 dark:hover:text-red-400"
                      title="删除"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

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
              <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-500">
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

      {/* 编辑弹窗 */}
      {editingPost && (
        <EditPostForm
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={() => window.location.reload()}
        />
      )}
    </>
  );
}
