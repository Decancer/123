"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

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

/** 追加消息并去重（防止长轮询和增量拉取竞态） */
function appendMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const existingIds = new Set(prev.map((m) => m.id));
  const fresh = incoming.filter((m) => !existingIds.has(m.id));
  return [...prev, ...fresh];
}

interface ChatRoomClientProps {
  currentUser: { id: number; name: string; avatar: string | null } | null;
}

const HB_INTERVAL = 10_000; // 10s 心跳 + 在线人数

export function ChatRoomClient({ currentUser }: ChatRoomClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [error, setError] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [navigateTo, setNavigateTo] = useState<string | null>(null);
  const router = useRouter();
  const navigatorLoading = navigateTo !== null;
  useLoadingReaction(navigatorLoading);

  // navigateTo 设置后，等 Portal 渲染再跳转
  useEffect(() => {
    if (navigateTo) {
      router.push(navigateTo);
    }
  }, [navigateTo, router]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef<number | null>(null);
  const hbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeRef = useRef(true); // 页面是否可见

  // ---------------------------------------------------------------
  // 长轮询：请求 → 等待 → 返回 → 立刻再请求（循环）
  // ---------------------------------------------------------------
  const longPoll = useCallback(async () => {
    if (latestIdRef.current == null) return;

    if (!activeRef.current) return;

    try {
      const res = await fetch(
        `/api/chat-room/messages?since=${latestIdRef.current}&wait=1`
      );
      if (!res.ok) return;
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => appendMessages(prev, data.messages));
        latestIdRef.current = data.latest;
      }
    } catch {
      // 网络错误静默忽略
    }

    // 无论有无新消息，立刻开始下一轮长轮询
    if (activeRef.current) {
      longPoll();
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
    } catch {}
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/chat-room/heartbeat", { method: "POST" });
    } catch {}
  }, [currentUser]);

  // ---------------------------------------------------------------
  // 初始加载
  // ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/chat-room/messages");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          latestIdRef.current =
            data.latest ??
            (data.messages.length > 0
              ? data.messages[data.messages.length - 1].id
              : null);
        }
      } catch {} finally {
        if (!cancelled) setInitialLoaded(true);
      }
    }

    init();
    fetchOnlineCount();
    if (currentUser) sendHeartbeat();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------
  // 初始加载完后启动长轮询 + 心跳定时器
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!initialLoaded) return;

    // 启动长轮询
    activeRef.current = true;
    longPoll();

    // 启动心跳定时器
    hbTimerRef.current = setInterval(() => {
      fetchOnlineCount();
      if (currentUser) sendHeartbeat();
    }, HB_INTERVAL);

    // 页面可见性：隐藏时标记不活跃，显示时恢复
    function handleVisibility() {
      activeRef.current = !document.hidden;
      if (!document.hidden) {
        // 回来先立刻拉一次最新（不用 wait 模式，秒回）
        fetch(`/api/chat-room/messages?since=${latestIdRef.current ?? 0}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.messages?.length > 0) {
              setMessages((prev) => appendMessages(prev, data.messages));
              latestIdRef.current = data.latest;
            }
          })
          .catch(() => {})
          .finally(() => {
            fetchOnlineCount();
            if (currentUser) sendHeartbeat();
            // 恢复长轮询
            longPoll();
          });
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (hbTimerRef.current) clearInterval(hbTimerRef.current);
      activeRef.current = false;
    };
  }, [initialLoaded, currentUser, longPoll, fetchOnlineCount, sendHeartbeat]);

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

      // 立即增量拉取（不用 wait，秒回），longPoll 会在返回后继续
      const fres = await fetch(
        `/api/chat-room/messages?since=${latestIdRef.current ?? 0}`
      );
      const data = await fres.json();
      if (data.messages?.length > 0) {
        setMessages((prev) => appendMessages(prev, data.messages));
        latestIdRef.current = data.latest;
      }
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
      {/* 导航加载动画 */}
      {navigatorLoading &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm">
            <img
              src="/mashiro.svg"
              alt="加载中"
              className="h-20 w-20 animate-spin"
            />
          </div>,
          document.body
        )}
      {/* 头部 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">
          💬 聊天室
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          {onlineCount} 人在线
        </div>
      </div>

      {/* 消息列表 */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-card">
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
            <p className="text-muted">
              还没有消息，来发第一条吧喵~
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <a
                  href={`/users/${msg.userId}`}
                  onClick={(e) => { e.preventDefault(); setNavigateTo(`/users/${msg.userId}`); }}
                  className="block cursor-pointer transition hover:opacity-80"
                >
                  {msg.userAvatar ? (
                    <img
                      src={msg.userAvatar}
                      alt={msg.userName}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary-100"
                    />
                  ) : (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                      {msg.userName.charAt(0)}
                    </span>
                  )}
                </a>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <a
                    href={`/users/${msg.userId}`}
                    onClick={(e) => { e.preventDefault(); setNavigateTo(`/users/${msg.userId}`); }}
                    className="cursor-pointer text-sm font-medium text-ink hover:text-primary-500 hover:underline transition"
                  >
                    {msg.userName}
                  </a>
                  <time className="text-xs text-muted/70">
                    {new Date(msg.createdAt).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="break-words text-sm leading-relaxed text-ink/90">
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
        <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
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
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 active:scale-95 disabled:opacity-50"
            >
              {loading ? "发送中…" : "发送"}
            </button>
          </>
        ) : (
          <div className="flex-1 rounded-xl border border-dashed border-primary-200 bg-primary-50/50 px-4 py-2.5 text-center text-sm text-muted">
            <a href="/login" className="font-medium text-primary-500 hover:text-primary-600">
              登录
            </a>
            {" "}后即可发送消息
          </div>
        )}
      </form>
    </div>
  );
}
