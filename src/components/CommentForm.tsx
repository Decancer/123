"use client";

import { useState, FormEvent } from "react";

interface CommentFormProps {
  slug: string;
  userName: string;
}

export function CommentForm({ slug, userName }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("请输入评论内容");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "评论失败");
        return;
      }

      const data = await res.json();

      // 成功 — 通知 CommentSection 立即追加新评论
      setContent("");
      setSuccess(true);
      window.dispatchEvent(
        new CustomEvent("comment:posted", { detail: data })
      );
      window.dispatchEvent(
        new CustomEvent("mashiro:reaction", {
          detail: {
            motion: "kime",
            expression: "kime",
            duration: 4000,
          },
        })
      );
      setTimeout(() => setSuccess(false), 1200);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-medium text-ink/80">
        发表评论（{userName}）
      </p>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✅ 评论发表成功！正在刷新...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的想法..."
            rows={3}
            className="w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          />

          <div className="mt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 active:scale-95 disabled:opacity-50"
            >
              {loading ? "提交中..." : "发表评论"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
