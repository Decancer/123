"use client";

import { useState, FormEvent } from "react";

const VALID_CATEGORIES = ["tech", "life"] as const;

export function WriteArticleButton() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<"tech" | "life">("tech");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function addTag() {
    const name = tagInput.trim();
    if (!name) return;
    if (tags.includes(name)) {
      setTagInput("");
      return;
    }
    setTags([...tags, name]);
    setTagInput("");
  }

  function removeTag(index: number) {
    setTags(tags.filter((_, i) => i !== index));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt, tags, category }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "发布失败");
        return;
      }

      setTitle("");
      setExcerpt("");
      setContent("");
      setTags([]);
      setOpen(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 1000);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {/* 折叠：圆形按钮 — 在 ChatWidget 上方 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 shadow-lg transition hover:scale-110 hover:shadow-xl flex items-center justify-center text-white text-2xl"
          aria-label="写文章"
        >
          ✏️
        </button>
      )}

      {/* 展开：写文章面板 */}
      {open && (
        <div className="flex h-[500px] w-[calc(100vw-1.5rem)] sm:w-[420px] flex-col rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              ✏️ 写文章
            </span>
            <button
              onClick={() => { setOpen(false); setError(""); }}
              className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="关闭"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 表单区 */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-600 dark:bg-green-950 dark:text-green-400">
                发布成功！正在刷新...
              </div>
            )}

            {/* 标题 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              required
              className="w-full border-b-2 border-zinc-200 bg-transparent pb-1.5 text-lg font-semibold outline-none transition placeholder:text-zinc-300 focus:border-blue-500 dark:border-zinc-700 dark:placeholder:text-zinc-600"
            />

            {/* 摘要 */}
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="摘要（可选，留空自动截取正文）"
              className="w-full bg-transparent text-sm text-zinc-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            />

            {/* 分区 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory("tech")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  category === "tech"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                💻 技术
              </button>
              <button
                type="button"
                onClick={() => setCategory("life")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  category === "life"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                🌿 生活
              </button>
            </div>

            {/* 正文 */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写你想写的..."
              required
              rows={10}
              className="w-full flex-1 resize-none rounded-lg bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed outline-none transition placeholder:text-zinc-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-zinc-800 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-800"
            />

            {/* 标签 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="ml-0.5 text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={tags.length === 0 ? "添加标签（回车确认）" : "+"}
                className="w-28 bg-transparent px-1 py-0.5 text-xs text-zinc-400 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
              />
            </div>

            {/* 发布按钮 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "发布中..." : "发布"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
