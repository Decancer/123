"use client";

import { useState } from "react";
import { EditPostForm } from "@/components/EditPostForm";

interface PostActionsProps {
  post: {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    category: string;
    tags: Array<{ tag: { id: number; name: string } }>;
    authorId: number;
  };
  currentUserId: number;
}

export function PostActions({ post, currentUserId }: PostActionsProps) {
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (post.authorId !== currentUserId) return null;

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/posts/${post.slug}`, { method: "DELETE" });
      window.location.href = "/";
    } catch {
      alert("删除失败");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 ml-3">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
          title="编辑文章"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {deleteConfirm ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-600"
          >
            {deleting ? "..." : "确定删除?"}
          </button>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400"
            title="删除文章"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {editing && (
        <EditPostForm
          post={post}
          onClose={() => setEditing(false)}
          onSaved={() => window.location.reload()}
        />
      )}
    </>
  );
}
