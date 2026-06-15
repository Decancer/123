"use client";

import { useState, FormEvent } from "react";

interface WriteArticleProps {
  userName: string;
}

export function WriteArticle({ userName }: WriteArticleProps) {
  const [expanded, setExpanded] = useState(false);
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

      // 发布成功，重置表单
      setTitle("");
      setExcerpt("");
      setContent("");
      setTags([]);
      setExpanded(false);
      setSuccess(true);

      // 3 秒后刷新列表
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

  if (!expanded) {
    return (
      <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 p-6 text-left transition hover:border-blue-400 hover:bg-blue-50/30 dark:border-zinc-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl dark:bg-blue-900">
            ✏️
          </span>
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              写点什么吧，{userName}
            </p>
            <p className="text-sm text-zinc-400">分享你的想法...</p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="mb-6 text-lg font-semibold">✏️ 写文章</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* 错误 / 成功提示 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">
            文章发布成功！正在刷新...
          </div>
        )}

        {/* 标题 */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            required
            className="w-full border-b-2 border-zinc-200 bg-transparent pb-2 text-xl font-semibold outline-none transition placeholder:text-zinc-300 focus:border-blue-500 dark:border-zinc-700 dark:placeholder:text-zinc-600 dark:focus:border-blue-400"
          />
        </div>

        {/* 摘要 */}
        <div className="mb-4">
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="摘要（可选，留空自动截取正文前 150 字）"
            className="w-full bg-transparent text-sm text-zinc-500 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />
        </div>

        {/* 分区选择 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            分区
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory("tech")}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
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
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                category === "life"
                  ? "bg-green-600 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              🌿 生活
            </button>
          </div>
        </div>

        {/* 正文 */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写你想写的..."
            required
            rows={8}
            className="w-full resize-y rounded-lg bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed outline-none transition placeholder:text-zinc-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:bg-zinc-800 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-800"
          />
        </div>

        {/* 标签 */}
        <div className="mb-5">
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
              placeholder={tags.length === 0 ? "添加标签（回车确认）" : "+ 标签"}
              className="w-36 bg-transparent px-1 py-0.5 text-xs text-zinc-400 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "发布中..." : "发布文章"}
          </button>
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setError("");
            }}
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
