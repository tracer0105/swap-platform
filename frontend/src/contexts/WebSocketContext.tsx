import React, { createContext, useContext } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

type WSContextType = ReturnType<typeof useWebSocket>;

const WSContext = createContext<WSContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const ws = useWebSocket();
  return <WSContext.Provider value={ws}>{children}</WSContext.Provider>;
}

export function useWS() {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("useWS must be used within WebSocketProvider");
  return ctx;
}
