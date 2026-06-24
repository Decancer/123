"use client";

import { useState, useEffect } from "react";
import { CommentItem } from "@/components/CommentItem";

interface Comment {
  id: number;
  content: string;
  createdAt: Date | string;
  author: { id: number; name: string | null; avatar: string | null };
}

interface Props {
  slug: string;
  initialComments: Comment[];
  initialHasMore: boolean;
  totalCount: number;
  currentUserId?: number;
  currentUserRole?: string;
}

export function CommentSection({
  slug,
  initialComments,
  initialHasMore,
  totalCount,
  currentUserId,
  currentUserRole,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // 监听新评论事件，立即追加到列表
  useEffect(() => {
    function handleNewComment(e: CustomEvent) {
      const comment = e.detail as Comment;
      if (!comment || !comment.id) return;
      setComments((prev) => {
        // 去重
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    }
    window.addEventListener("comment:posted", handleNewComment as EventListener);
    return () => window.removeEventListener("comment:posted", handleNewComment as EventListener);
  }, []);

  async function loadMore() {
    setLoading(true);
    try {
      const lastId = comments[comments.length - 1]?.id;
      const res = await fetch(`/api/posts/${slug}/comments?cursor=${lastId || 0}&take=20`);
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, ...(data.comments || [])]);
        setHasMore(data.hasMore ?? false);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (comments.length === 0) {
    return (
      <section className="mt-16 border-t border-border pt-10">
        <h3 className="mb-6 text-lg font-semibold text-ink">
          评论 ({totalCount})
        </h3>
        <p className="text-sm text-muted">暂无评论，来发表第一条吧</p>
      </section>
    );
  }

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h3 className="mb-6 text-lg font-semibold text-ink">
        评论 ({totalCount})
      </h3>

      <div className="space-y-5">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={{
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
              author: comment.author,
            }}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted transition hover:border-primary-300 hover:text-primary-600 disabled:opacity-50"
          >
            {loading ? "加载中..." : "加载更多评论"}
          </button>
        </div>
      )}
    </section>
  );
}
