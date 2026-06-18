"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "写你想写的...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none outline-none min-h-[200px] px-3 py-2.5 text-sm leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className="min-h-[200px] rounded-lg bg-zinc-50 animate-pulse dark:bg-zinc-800" />
    );
  }

  const btnBase =
    "rounded px-1.5 py-0.5 text-xs font-medium transition hover:bg-zinc-200 dark:hover:bg-zinc-700";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
        {/* 粗体 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} ${editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="粗体"
        >
          <strong>B</strong>
        </button>

        {/* 斜体 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} ${editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="斜体"
        >
          <em>I</em>
        </button>

        <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* H2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btnBase} ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="二级标题"
        >
          H2
        </button>

        {/* H3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btnBase} ${editor.isActive("heading", { level: 3 }) ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="三级标题"
        >
          H3
        </button>

        <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* 行内代码 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${btnBase} font-mono ${editor.isActive("code") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="行内代码"
        >
          {"</>"}
        </button>

        {/* 代码块 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${btnBase} font-mono ${editor.isActive("codeBlock") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="代码块"
        >
          {"{ }"}
        </button>

        {/* 引用 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${btnBase} ${editor.isActive("blockquote") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="引用"
        >
          ❝
        </button>

        <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* 无序列表 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btnBase} ${editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="无序列表"
        >
          •≡
        </button>

        {/* 有序列表 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} ${editor.isActive("orderedList") ? "bg-zinc-200 dark:bg-zinc-700" : "text-zinc-500"}`}
          title="有序列表"
        >
          1.
        </button>

        {/* 分隔线 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`${btnBase} text-zinc-500`}
          title="分隔线"
        >
          —
        </button>

        <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* 撤销 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${btnBase} text-zinc-500 disabled:opacity-30`}
          title="撤销"
        >
          ↩
        </button>

        {/* 重做 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${btnBase} text-zinc-500 disabled:opacity-30`}
          title="重做"
        >
          ↪
        </button>
      </div>

      {/* 编辑区 */}
      <EditorContent editor={editor} />
    </div>
  );
}
