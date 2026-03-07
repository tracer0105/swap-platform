import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

type MessageHandler = (data: any) => void;

// 动态计算 WebSocket 地址，自动适配当前域名（支持 http/https、ws/wss）
function getWsBase(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}`;
}

export function useWebSocket() {
  const { token } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsBase = getWsBase();
    const ws = new WebSocket(`${wsBase}/ws/chat/${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const type = data.type;

        if (type === "online_users") {
          setOnlineUsers(data.user_ids);
          return;
        }
        if (type === "online_status") {
          setOnlineUsers((prev) =>
            data.online
              ? [...new Set([...prev, data.user_id])]
              : prev.filter((id) => id !== data.user_id)
          );
        }

        const handlers = handlersRef.current.get(type) || [];
        handlers.forEach((h) => h(data));

        const allHandlers = handlersRef.current.get("*") || [];
        allHandlers.forEach((h) => h(data));
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // 5秒后自动重连
      reconnectTimerRef.current = setTimeout(() => {
        if (token) connect();
      }, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [token]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const on = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type) || [];
    handlersRef.current.set(type, [...handlers, handler]);
    return () => {
      const current = handlersRef.current.get(type) || [];
      handlersRef.current.set(type, current.filter((h) => h !== handler));
    };
  }, []);

  const isUserOnline = useCallback(
    (userId: number) => onlineUsers.includes(userId),
    [onlineUsers]
  );

  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [token]);

  return { isConnected, sendMessage, on, isUserOnline, onlineUsers };
}
