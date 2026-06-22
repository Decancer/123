"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";

interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
}

interface OnlineInfo {
  count: number;
}

interface ChatRoomClientProps {
  currentUser: { id: number; name: string; avatar: string | null } | null;
}

const POLL_INTERVAL = 2000; // 2s 消息轮询
const HB_INTERVAL = 10_000; // 10s 心跳 + 在线人数

export function ChatRoomClient({ currentUser }: ChatRoomClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef<number | null>(null); // 已拉取的最新消息 id，用于增量轮询
  const timersRef = useRef<{ msg: ReturnType<typeof setInterval> | null; hb: ReturnType<typeof setInterval> | null }>({ msg: null, hb: null });

  // ---------------------------------------------------------------
  // 拉取消息（首次全量，后续增量）
  // ---------------------------------------------------------------
  const fetchMessages = useCallback(async () => {
    try {
      const url = latestIdRef.current != null
        ? `/api/chat-room/messages?since=${latestIdRef.current}`
        : "/api/chat-room/messages";

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        if (latestIdRef.current != null) {
          // 增量模式：追加新消息
          setMessages((prev) => [...prev, ...data.messages]);
        } else {
          // 全量模式：初始加载
          setMessages(data.messages);
        }
        // 更新最新 id
        const newLatest = data.latest ?? data.messages[data.messages.length - 1].id;
        latestIdRef.current = newLatest;
      }
    } catch {
      // 轮询失败静默忽略
    }
  }, []);

  // ---------------------------------------------------------------
  // 在线人数 + 心跳
  // ---------------------------------------------------------------
  const fetchOnlineCount = useCallback(async () => {
    try {
      const res = await fetch("/api/chat-room/heartbeat");
      if (!res.ok) return;
      const data: OnlineInfo = await res.json();
      setOnlineCount(data.count);
    } catch {
      // 静默忽略
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/chat-room/heartbeat", { method: "POST" });
    } catch {
      // 静默忽略
    }
  }, [currentUser]);

  // ---------------------------------------------------------------
  // 启停轮询
  // ---------------------------------------------------------------
  const startTimers = useCallback(() => {
    if (timersRef.current.msg) clearInterval(timersRef.current.msg);
    if (timersRef.current.hb) clearInterval(timersRef.current.hb);
    timersRef.current.msg = setInterval(fetchMessages, POLL_INTERVAL);
    timersRef.current.hb = setInterval(() => {
      fetchOnlineCount();
      if (currentUser) sendHeartbeat();
    }, HB_INTERVAL);
  }, [fetchMessages, fetchOnlineCount, sendHeartbeat, currentUser]);

  const stopTimers = useCallback(() => {
    if (timersRef.current.msg) { clearInterval(timersRef.current.msg); timersRef.current.msg = null; }
    if (timersRef.current.hb) { clearInterval(timersRef.current.hb); timersRef.current.hb = null; }
  }, []);

  // ---------------------------------------------------------------
  // 初始加载
  // ---------------------------------------------------------------
  useEffect(() => {
    fetchMessages().then(() => setInitialLoaded(true));
    fetchOnlineCount();
    if (currentUser) sendHeartbeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------
  // 页面可见性：隐藏时停轮询，回来立即刷新
  // ---------------------------------------------------------------
  useEffect(() => {
    startTimers();

    function handleVisibility() {
      if (document.hidden) {
        stopTimers();
      } else {
        // 回来先立即拉一次，再重启定时器
        fetchMessages();
        fetchOnlineCount();
        if (currentUser) sendHeartbeat();
        startTimers();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopTimers();
    };
  }, [startTimers, stopTimers, fetchMessages, fetchOnlineCount, sendHeartbeat, currentUser]);

  // ---------------------------------------------------------------
  // 新消息自动滚到底部
  // ---------------------------------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------------------------------------------
  // 发送消息
  // ---------------------------------------------------------------
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat-room/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "发送失败");
        return;
      }

      setInput("");
      setError("");

      window.dispatchEvent(
        new CustomEvent("mashiro:reaction", {
          detail: { motion: "kandou", expression: "kandou", duration: 3000 },
        })
      );

      // 立即拉取（用增量模式）
      await fetchMessages();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------------
  // 渲染
  // ---------------------------------------------------------------
  return (
    <div className="flex flex-col mx-auto" style={{ height: "calc(100vh - 7rem)" }}>
      {/* 头部：标题 + 在线人数 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          💬 聊天室
        </h1>
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          {onlineCount} 人在线
        </div>
      </div>

      {/* 消息列表 */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {!initialLoaded && (
          <div className="flex items-center justify-center py-16">
            <img
              src="/mashiro.svg"
              alt="加载中"
              className="h-12 w-12 animate-spin opacity-40"
            />
          </div>
        )}

        {initialLoaded && messages.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-zinc-400 dark:text-zinc-500">
              还没有消息，来发第一条吧喵~
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {msg.userAvatar ? (
                  <img
                    src={msg.userAvatar}
                    alt={msg.userName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {msg.userName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {msg.userName}
                  </span>
                  <time className="text-xs text-zinc-400 dark:text-zinc-500">
                    {new Date(msg.createdAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 输入区 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {currentUser ? (
          <>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入消息… 和大家打个招呼吧~"
              maxLength={500}
              disabled={loading}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-zinc-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder:text-zinc-600 dark:focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "发送中…" : "发送"}
            </button>
          </>
        ) : (
          <div className="flex-1 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-2.5 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            <a href="/login" className="text-blue-500 hover:text-blue-600">
              登录
            </a>
            {" "}后即可发送消息
          </div>
        )}
      </form>
    </div>
  );
}
