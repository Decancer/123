"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { AuthorLink } from "@/components/AuthorLink";

interface CommentItemProps {
  comment: {
    id: number;
    content: string;
    createdAt: Date | string;
    author: { id: number; name: string | null; avatar: string | null };
  };
  currentUserId?: number;
  currentUserRole?: string;
}

export function CommentItem({ comment, currentUserId, currentUserRole }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  // 点击空白处取消删除确认
  useEffect(() => {
    if (!deleteConfirm) return;
    function handleClick(e: MouseEvent) {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setDeleteConfirm(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [deleteConfirm]);
  const [content, setContent] = useState(comment.content);

  const isOwn = currentUserId === comment.author.id;
  const canDelete = isOwn || currentUserRole === "admin";

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (res.ok) {
        setContent(editText);
        setEditing(false);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      window.location.reload();
    } catch {
      alert("删除失败");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AuthorLink
            userId={comment.author.id}
            name={comment.author.name || "User"}
            avatar={comment.author.avatar}
          />
          <time className="text-xs text-zinc-400" dateTime={new Date(comment.createdAt).toISOString()}>
            {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
          </time>
        </div>

        {/* 操作按钮 */}
        {(isOwn || canDelete) && (
          <div ref={btnRef} className="flex items-center gap-0.5">
            {isOwn && (
              <button
                onClick={() => { setEditing(true); setEditText(content); }}
                className="rounded p-0.5 text-zinc-300 transition hover:text-blue-500"
                title="编辑"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {canDelete && (
              deleteConfirm ? (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  {deleting ? "..." : "确定"}
                </button>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="rounded p-0.5 text-zinc-300 transition hover:text-red-500"
                  title="删除"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* 内容 / 编辑框 */}
      {editing ? (
        <form onSubmit={handleEdit} className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {content}
        </p>
      )}
    </div>
  );
}
