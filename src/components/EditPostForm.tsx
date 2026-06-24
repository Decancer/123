"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { RichTextEditor } from "./RichTextEditor";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;

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
        if (width <= MAX_DIMENSION && file.size < 500 * 1024) {
          resolve(reader.result as string);
          return;
        }
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

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  images: string | null;
  category: string;
  tags: Array<{ tag: { id: number; name: string } }>;
}

interface EditPostFormProps {
  post: Post;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPostForm({ post, onClose, onSaved }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [category, setCategory] = useState(post.category);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    post.tags.map((t) => t.tag.name)
  );
  const initialImages: string[] = (() => {
    if (!post.images) return [];
    try { return JSON.parse(post.images); } catch { return []; }
  })();
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  function addTag(value?: string) {
    const name = (value ?? tagInput).trim();
    if (!name || tags.includes(name)) {
      setTagInput("");
      return;
    }
    setTags([...tags, name]);
    setTagInput("");
  }

  function removeTag(name: string) {
    setTags(tags.filter((t) => t !== name));
  }

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${post.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt: excerpt || null, category, tags, images }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">
            编辑文章
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted/60 transition hover:bg-primary-50 hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* 标题 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            required
            className="w-full border-b-2 border-primary-200 bg-transparent py-2 text-lg font-semibold text-ink outline-none placeholder:text-muted/40 focus:border-primary-400"
          />

          {/* 分区选择 */}
          <div className="flex gap-2">
            {(["tech", "life"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  category === c
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-primary-50 text-muted hover:bg-primary-100"
                }`}
              >
                {c === "tech" ? "💻 技术" : "🌿 生活"}
              </button>
            ))}
          </div>

          {/* 摘要 */}
          <input
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="文章摘要（可选）"
            className="w-full rounded-xl border border-border bg-primary-50/50 px-3.5 py-2 text-sm text-ink outline-none placeholder:text-muted/40 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          />

          {/* 内容 */}
          <RichTextEditor
            content={content}
            onChange={setContent}
          />

          {/* 标签 */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                >
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              onBlur={() => addTag()}
              placeholder="输入标签后回车"
              className="w-full rounded-xl border border-border bg-primary-50/50 px-3.5 py-2 text-sm text-ink outline-none placeholder:text-muted/40 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {/* 图片 */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-muted">
                图片 ({images.length}/{MAX_IMAGES})
              </span>
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs text-muted transition hover:bg-primary-100 disabled:opacity-50"
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
                      className="h-16 w-16 rounded-xl object-cover border border-border"
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

          {error && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted transition hover:bg-primary-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-95 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
