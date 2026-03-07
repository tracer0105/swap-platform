import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { chatApi } from "../api";
import type { Conversation, Message, User } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useWS } from "../contexts/WebSocketContext";
import toast from "react-hot-toast";
import { Send, MessageCircle, Circle } from "lucide-react";
import { API_BASE } from "../api/client";

function Avatar({ user, size = "md" }: { user: User; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-sm" : "w-10 h-10 text-base";
  return (
    <div className={`${sz} rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {user.avatar ? (
        <img src={`${API_BASE}${user.avatar}`} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium text-primary-600">{user.username[0].toUpperCase()}</span>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export default function Chat() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const { user: currentUser } = useAuthStore();
  const { sendMessage, on, isUserOnline } = useWS();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data);
    } catch {}
    setLoadingConvs(false);
  }, []);

  useEffect(() => { loadConversations(); }, []);

  // 处理 URL 参数打开指定会话
  useEffect(() => {
    if (targetUserId && !loadingConvs) {
      const conv = conversations.find((c) => c.partner.id === Number(targetUserId));
      if (conv) {
        openConversation(conv.partner);
      } else {
        // 从 API 获取用户信息
        import("../api").then(({ authApi }) => {
          authApi.getUserPublic(Number(targetUserId)).then((res) => {
            openConversation(res.data as User);
          });
        });
      }
    }
  }, [targetUserId, loadingConvs]);

  const openConversation = async (partner: User) => {
    setActivePartner(partner);
    setLoadingMsgs(true);
    try {
      const res = await chatApi.getMessages(partner.id);
      setMessages(res.data.messages);
      // 标记已读
      sendMessage({ type: "read", sender_id: partner.id });
      // 更新会话未读数
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === partner.id ? { ...c, unread_count: 0 } : c
        )
      );
    } catch {}
    setLoadingMsgs(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    inputRef.current?.focus();
  };

  // 监听 WebSocket 消息
  useEffect(() => {
    const unsubMsg = on("message", (data) => {
      const msg: Message = data.data;
      // 如果是当前会话的消息
      if (
        activePartner &&
        (msg.sender_id === activePartner.id || msg.receiver_id === activePartner.id)
      ) {
        setMessages((prev) => [...prev, msg]);
        sendMessage({ type: "read", sender_id: msg.sender_id });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
      // 更新会话列表
      loadConversations();
    });

    const unsubSent = on("message_sent", (data) => {
      const msg: Message = data.data;
      setMessages((prev) => {
        // 避免重复
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConversations();
    });

    return () => {
      unsubMsg();
      unsubSent();
    };
  }, [activePartner, on, sendMessage, loadConversations]);

  const handleSend = () => {
    if (!inputText.trim() || !activePartner) return;
    const sent = sendMessage({
      type: "message",
      receiver_id: activePartner.id,
      content: inputText.trim(),
      msg_type: "text",
    });
    if (!sent) {
      toast.error("连接已断开，请刷新页面重试");
      return;
    }
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 会话列表 */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle size={18} />
              消息
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-auto">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400 px-4">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无消息</p>
                <p className="text-xs mt-1">去浏览物品，联系物品主人吧</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partner.id}
                  onClick={() => openConversation(conv.partner)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    activePartner?.id === conv.partner.id ? "bg-primary-50" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar user={conv.partner} />
                    {isUserOnline(conv.partner.id) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {conv.partner.username}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 truncate">
                        {conv.last_message.sender_id === currentUser?.id ? "我：" : ""}
                        {conv.last_message.content}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="flex-shrink-0 ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {conv.unread_count > 9 ? "9+" : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 聊天区域 */}
        {activePartner ? (
          <div className="flex-1 flex flex-col">
            {/* 顶部栏 */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="relative">
                <Avatar user={activePartner} />
                {isUserOnline(activePartner.id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activePartner.username}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Circle
                    size={8}
                    className={isUserOnline(activePartner.id) ? "fill-green-500 text-green-500" : "fill-gray-300 text-gray-300"}
                  />
                  {isUserOnline(activePartner.id) ? "在线" : "离线"}
                </p>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">还没有消息，发送第一条消息吧！</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2`}>
                      {!isMine && <Avatar user={activePartner} size="sm" />}
                      <div className={`max-w-xs lg:max-w-md ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? "bg-primary-600 text-white rounded-tr-sm"
                              : "bg-gray-100 text-gray-900 rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5 px-1">
                          {formatTime(msg.created_at)}
                          {isMine && msg.is_read === "true" && (
                            <span className="ml-1 text-primary-400">已读</span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="输入消息，Enter 发送..."
                  maxLength={500}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p>选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
