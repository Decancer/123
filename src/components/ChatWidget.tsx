"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

interface ChatWidgetProps {
  user: { id: number; name: string } | null;
}

/** 从 UIMessage parts 中提取纯文本 */
function getMessageText(m: { role: string; parts: Array<unknown> }): string {
  return (m.parts as Array<{ type: string; text?: string }>)
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function ChatWidget({ user }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error, clearError } =
    useChat({
      transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

  const isLoading = status === "submitted" || status === "streaming";

  // 新消息自动滚到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    clearError?.();
    sendMessage({ text: input });
    setInput("");
  }

  // 未登录：显示小提示条
  if (!user) {
    return (
      <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[70]">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 shadow-card dark:border-[#3a3a58] dark:bg-[#222240]">
          <img src="/mashiro.svg" alt="Mashiro" className="h-6 w-6 rounded-full" />
          <span className="text-xs text-muted dark:text-[#a0a0c0]">登录后可与我对话</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-[70]">
      {/* 折叠：圆形按钮 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          onMouseEnter={() =>
            window.dispatchEvent(
              new CustomEvent("mashiro:reaction", {
                detail: {
                  motion: "surprised",
                  expression: "surprised",
                  duration: 3000,
                },
              })
            )
          }
          onMouseLeave={() =>
            window.dispatchEvent(
              new CustomEvent("mashiro:reaction", {
                detail: { motion: "idle", expression: "reset" },
              })
            )
          }
          className="h-14 w-14 rounded-full shadow-card transition hover:scale-110 hover:shadow-glow overflow-hidden ring-2 ring-primary-200 hover:ring-primary-400 dark:ring-primary-500/30 dark:hover:ring-primary-400/50"
          aria-label="打开 AI 聊天"
        >
          <img src="/mashiro.svg" alt="Mashiro" className="h-full w-full object-cover" />
        </button>
      )}

      {/* 展开：聊天面板 */}
      {open && (
        <div className="flex h-[500px] w-[calc(100vw-1.5rem)] sm:w-[380px] flex-col rounded-2xl border border-border bg-surface shadow-xl dark:border-[#3a3a58] dark:bg-[#222240]">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-[#3a3a58]">
            <div className="flex items-center gap-2">
              <img src="/mashiro.svg" alt="Mashiro" className="h-7 w-7 rounded-full" />
              <span className="text-sm font-medium text-ink dark:text-[#e8e8f8]">
                Mashiro
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-muted/60 transition hover:bg-primary-50 hover:text-ink dark:hover:bg-[#3a3a58] dark:hover:text-[#e8e8f8]"
              aria-label="关闭聊天"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 消息区 */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <img src="/mashiro.svg" alt="Mashiro" className="mx-auto h-12 w-12 rounded-full" />
                <p className="mt-2 text-sm text-muted dark:text-[#a0a0c0]">
                  你好，{user.name}！有什么我可以帮你的吗？
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary-500 text-white"
                      : "bg-primary-50 text-ink dark:bg-[#3a3a58] dark:text-[#e8e8f8]"
                  }`}
                >
                  {getMessageText(m)}
                </div>
              </div>
            ))}

            {/* 加载动画 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-primary-50 px-4 py-2.5 dark:bg-[#3a3a58]">
                  <span className="inline-flex gap-1">
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-primary-400"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-primary-400"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-2 w-2 animate-bounce rounded-full bg-primary-400"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error.message || "发送失败，请重试"}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border p-3 dark:border-[#3a3a58]"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入消息..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-border bg-primary-50/50 px-3.5 py-2 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-[#3a3a58] dark:bg-[#16162a] dark:text-[#e8e8f8] dark:placeholder:text-[#a0a0c0]/50 dark:focus:border-primary-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 active:scale-95 disabled:opacity-50 dark:bg-primary-400 dark:text-[#16162a] dark:hover:bg-primary-300"
              >
                发送
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
