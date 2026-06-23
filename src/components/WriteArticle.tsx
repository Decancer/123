"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./RichTextEditor";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB 原始文件上限
const MAX_DIMENSION = 1920; // 压缩后最大宽度

/** 将 File 压缩并转为 base64 */
function compressAndEncode(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error(`图片 "${file.name}" 超过 5MB 限制`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        // 不需要压缩的小图直接返回
        if (width <= MAX_DIMENSION && file.size < 500 * 1024) {
          resolve(reader.result as string);
          return;
        }

        // 压缩大图
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, MAX_DIMENSION / Math.max(width, height));
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

const VALID_CATEGORIES = ["tech", "life"] as const;

export function WriteArticleButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<"tech" | "life">("tech");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 6;

  async function handleAddImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (images.length + files.length > MAX_IMAGES) {
      setError(`最多只能上传 ${MAX_IMAGES} 张图片`);
      return;
    }
    setUploadingImage(true);
    setError("");
    try {
      const base64Arr = await Promise.all(files.map(compressAndEncode));
      setImages((prev) => [...prev, ...base64Arr].slice(0, MAX_IMAGES));
    } catch {
      setError("图片处理失败");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

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
        body: JSON.stringify({ title, content, excerpt, tags, category, images }),
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
      setImages([]);
      setSuccess(true);
      // 通知 Live2D 看板娘：得意！
      window.dispatchEvent(
        new CustomEvent("mashiro:reaction", {
          detail: {
            motion: "kime",
            expression: "kime",
            duration: 4000,
          },
        })
      );
      // 短暂显示成功提示后关闭面板 + 刷新页面数据（不整页重载）
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        router.refresh();
      }, 1200);
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
          className="h-14 w-14 rounded-full bg-primary-500 shadow-card transition hover:scale-110 hover:shadow-glow flex items-center justify-center text-white text-2xl ring-2 ring-primary-200 hover:ring-primary-400 dark:ring-primary-500/30 dark:hover:ring-primary-400/50"
          aria-label="写文章"
        >
          ✏️
        </button>
      )}

      {/* 展开：写文章面板 */}
      {open && (
        <div className="flex h-[500px] w-[calc(100vw-1.5rem)] sm:w-[420px] flex-col rounded-2xl border border-border bg-surface shadow-xl dark:border-[#2a2a45] dark:bg-[#1a1a30]">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-[#2a2a45]">
            <span className="text-sm font-medium text-ink dark:text-[#e0e0f0]">
              ✏️ 写文章
            </span>
            <button
              onClick={() => { setOpen(false); setError(""); }}
              className="rounded-lg p-1 text-muted/60 transition hover:bg-primary-50 hover:text-ink dark:hover:bg-[#2a2a45] dark:hover:text-[#e0e0f0]"
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
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
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
              className="w-full border-b-2 border-primary-200 bg-transparent pb-1.5 text-lg font-semibold text-ink outline-none transition placeholder:text-muted/40 focus:border-primary-400 dark:border-[#2a2a45] dark:text-[#e0e0f0] dark:placeholder:text-[#9090a8]/40 dark:focus:border-primary-400"
            />

            {/* 摘要 */}
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="摘要（可选，留空自动截取正文）"
              className="w-full bg-transparent text-sm text-muted outline-none placeholder:text-muted/40 dark:text-[#9090a8] dark:placeholder:text-[#9090a8]/40"
            />

            {/* 分区 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCategory("tech")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  category === "tech"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-primary-50 text-muted hover:bg-primary-100 dark:bg-[#2a2a45] dark:text-[#9090a8] dark:hover:bg-[#3a3a55]"
                }`}
              >
                💻 技术
              </button>
              <button
                type="button"
                onClick={() => setCategory("life")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  category === "life"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-primary-50 text-muted hover:bg-primary-100 dark:bg-[#2a2a45] dark:text-[#9090a8] dark:hover:bg-[#3a3a55]"
                }`}
              >
                🌿 生活
              </button>
            </div>

            {/* 正文 */}
            <RichTextEditor
              content={content}
              onChange={setContent}
            />

            {/* 标签 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-0.5 rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="ml-0.5 text-primary-400 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-100"
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
                className="w-28 bg-transparent px-1 py-0.5 text-xs text-muted/60 outline-none placeholder:text-muted/40 dark:text-[#9090a8]/60 dark:placeholder:text-[#9090a8]/40"
              />
            </div>

            {/* 图片上传 */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-medium text-muted dark:text-[#9090a8]">
                  图片 ({images.length}/{MAX_IMAGES})
                </span>
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs text-muted transition hover:bg-primary-100 disabled:opacity-50 dark:bg-[#2a2a45] dark:text-[#9090a8] dark:hover:bg-[#3a3a55]"
                  >
                    {uploadingImage ? "处理中..." : "+ 添加"}
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleAddImages}
                />
              </div>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover border border-border dark:border-[#2a2a45]"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 发布按钮 */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-95 disabled:opacity-50 dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300"
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
