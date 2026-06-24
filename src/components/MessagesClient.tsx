"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoadingReaction } from "@/lib/useLive2DReaction";

// ================================================================
// Types
// ================================================================

interface CurrentUser {
  id: number;
  name: string | null;
  avatar: string | null;
}

interface Message {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  createdAt: string;
}

interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
}

interface MessagesClientProps {
  currentUser: CurrentUser | null;
}

// ================================================================
// Constants
// ================================================================

const LONG_POLL_TIMEOUT = 8000;

// ================================================================
// Sub-component: ChatView (when ?to= is set)
// ================================================================

function ChatView({
  currentUser,
  partnerId,
  onBack,
}: {
  currentUser: CurrentUser;
  partnerId: number;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [partner, setPartner] = useState<{ name: string; avatar: string | null } | null>(null);
  const latestIdRef = useRef<number | null>(null);
  const activeRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动滚到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始加载
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/messages?with=${partnerId}`);
        if (!res.ok) {
          if (res.status === 401) { setError("请先登录"); return; }
          throw new Error("加载失败");
        }
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.latest != null) latestIdRef.current = data.latest;
        // 从首条消息推断对方信息
        if (data.messages?.length > 0) {
          const firstMsg = data.messages[0];
          const isSender = firstMsg.senderId === partnerId;
          setPartner({
            name: isSender ? firstMsg.senderName : firstMsg.senderName,
            avatar: null,
          });
        }
        // 取对方真实信息
        const lastMsg = data.messages?.find((m: Message) => m.senderId === partnerId);
        if (lastMsg) {
          setPartner({ name: lastMsg.senderName, avatar: lastMsg.senderAvatar });
        }
        setInitialLoaded(true);
      } catch {
        setError("加载消息失败");
      }
    }
    init();
    return () => { activeRef.current = false; };
  }, [partnerId]);

  // 从最后一条消息获取 latestId 后取对方名称
  useEffect(() => {
    if (!initialLoaded || messages.length === 0) return;
    const lastFromPartner = [...messages].reverse().find((m) => m.senderId === partnerId);
    if (lastFromPartner && !partner) {
      setPartner({ name: lastFromPartner.senderName, avatar: lastFromPartner.senderAvatar });
    }
  }, [initialLoaded, messages, partnerId, partner]);

  // 长轮询
  const longPoll = useCallback(async () => {
    if (!activeRef.current) return;
    try {
      const since = latestIdRef.current ?? 0;
      const res = await fetch(`/api/messages?with=${partnerId}&since=${since}&wait=1`, {
        signal: AbortSignal.timeout(LONG_POLL_TIMEOUT + 3000),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages?.length > 0) {
        setMessages((prev) => [...prev, ...data.messages]);
        if (data.latest != null) latestIdRef.current = data.latest;
      }
    } catch {
      // timeout or network error, continue
    }
    if (activeRef.current) longPoll();
  }, [partnerId]);

  useEffect(() => {
    if (!initialLoaded) return;
    activeRef.current = true;
    longPoll();
    return () => { activeRef.current = false; };
  }, [initialLoaded, longPoll]);

  // 页面可见性
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        activeRef.current = false;
      } else {
        activeRef.current = true;
        // 回来时增量拉取
        (async () => {
          const since = latestIdRef.current ?? 0;
          try {
            const res = await fetch(`/api/messages?with=${partnerId}&since=${since}`);
            if (res.ok) {
              const data = await res.json();
              if (data.messages?.length > 0) {
                setMessages((prev) => [...prev, ...data.messages]);
                if (data.latest != null) latestIdRef.current = data.latest;
              }
            }
          } catch { /* ignore */ }
        })();
        longPoll();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [partnerId, longPoll]);

  // 发送消息
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setError("");
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: partnerId, content: input.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "发送失败");
        return;
      }
      setInput("");
      // 通知 Live2D
      window.dispatchEvent(
        new CustomEvent("mashiro:reaction", {
          detail: { motion: "kandou", expression: "kandou", duration: 3000 },
        })
      );
      // 即时增量拉取
      const since = latestIdRef.current ?? 0;
      const refresh = await fetch(`/api/messages?with=${partnerId}&since=${since}`);
      if (refresh.ok) {
        const data = await refresh.json();
        if (data.messages?.length > 0) {
          setMessages((prev) => [...prev, ...data.messages]);
          if (data.latest != null) latestIdRef.current = data.latest;
        }
      }
      inputRef.current?.focus();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSending(false);
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      {/* 顶部：返回 + 对方信息 */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <button
          onClick={onBack}
          className="rounded-lg p-1 text-muted hover:text-ink hover:bg-primary-100 transition"
          title="返回会话列表"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {partner && (
          <div className="flex items-center gap-2">
            {partner.avatar ? (
              <img src={partner.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                {partner.name?.charAt(0) || "?"}
              </span>
            )}
            <span className="font-medium text-ink">{partner.name}</span>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && !error && (
          <p className="text-center text-sm text-muted mt-8">发送第一条私信吧～</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary-500 text-white rounded-br-md"
                      : "bg-surface border border-border text-ink rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="mt-0.5 text-[10px] text-muted/60">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</div>
      )}

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入私信内容..."
          maxLength={500}
          className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 active:scale-95 disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </div>
  );
}

// ================================================================
// Sub-component: ConversationListView (default view)
// ================================================================

function ConversationListView({
  onSelectConversation,
}: {
  onSelectConversation: (partnerId: number) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/messages/conversations");
        if (!res.ok) {
          if (res.status === 401) { setError("请先登录"); setLoading(false); return; }
          throw new Error("加载失败");
        }
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch {
        setError("加载会话列表失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatDate(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <img src="/mashiro.svg" alt="加载中" className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-red-500 py-20">{error}</p>;
  }

  if (conversations.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mb-3 text-4xl">📭</div>
        <p className="text-muted">还没有私信对话</p>
        <p className="mt-1 text-sm text-muted/60">去别人的主页点击「私信」按钮开始对话吧～</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <button
          key={conv.partnerId}
          onClick={() => onSelectConversation(conv.partnerId)}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left shadow-card transition hover:border-primary-300 hover:shadow-card-hover active:scale-[0.98]"
        >
          {/* 头像 */}
          {conv.partnerAvatar ? (
            <img src={conv.partnerAvatar} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
          ) : (
            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
              {conv.partnerName?.charAt(0) || "?"}
            </span>
          )}

          {/* 中间：名称 + 最新消息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink text-sm">{conv.partnerName}</span>
              {conv.unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-[10px] font-bold text-white">
                  {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {conv.lastMessage.senderId === (conv as Conversation & { _currentUserId?: number })._currentUserId
                ? "你: " : ""}
              {conv.lastMessage.content}
            </p>
          </div>

          {/* 右侧：时间 */}
          <span className="flex-shrink-0 text-[11px] text-muted/60">
            {formatDate(conv.lastMessage.createdAt)}
          </span>
        </button>
      ))}
    </div>
  );
}

// ================================================================
// Main component: MessagesClient
// ================================================================

export function MessagesClient({ currentUser }: MessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toStr = searchParams.get("to");
  const toUserId = toStr ? parseInt(toStr, 10) : null;
  const isValidTo = toUserId !== null && !isNaN(toUserId);

  const [navigateTo, setNavigateTo] = useState<string | null>(null);
  const navigateToRef = useRef<string | null>(null);
  useLoadingReaction(navigateTo !== null);

  // 导航 effect
  useEffect(() => {
    if (navigateTo) {
      navigateToRef.current = navigateTo;
      router.push(navigateTo);
    }
  }, [navigateTo, router]);

  // 导航完成后清除
  useEffect(() => {
    if (!navigateTo && navigateToRef.current) {
      navigateToRef.current = null;
    }
  }, [navigateTo]);

  function handleSelectConversation(partnerId: number) {
    setNavigateTo(`/messages?to=${partnerId}`);
  }

  function handleBackToList() {
    setNavigateTo("/messages");
  }

  // 未登录
  if (!currentUser) {
    return (
      <div className="py-20 text-center">
        <div className="mb-3 text-4xl">🔒</div>
        <p className="text-muted">请先登录才能查看私信</p>
      </div>
    );
  }

  return (
    <>
      {/* 全局加载遮罩 */}
      {navigateTo && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-50/80 backdrop-blur-sm">
          <img src="/mashiro.svg" alt="加载中" className="h-20 w-20 animate-spin" />
        </div>,
        document.body
      )}

      {/* 标题 */}
      <h1 className="mb-6 text-2xl font-bold text-ink">
        💬 私信
      </h1>

      {/* 根据 ?to= 参数切换视图 */}
      {isValidTo && toUserId !== currentUser.id ? (
        <ChatView
          currentUser={currentUser}
          partnerId={toUserId!}
          onBack={handleBackToList}
        />
      ) : (
        <ConversationListView onSelectConversation={handleSelectConversation} />
      )}
    </>
  );
}
