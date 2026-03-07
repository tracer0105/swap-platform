from fastapi import WebSocket
from typing import Dict, List
import json
from datetime import datetime


class ConnectionManager:
    """管理所有 WebSocket 连接，支持点对点消息推送"""

    def __init__(self):
        # user_id -> list of WebSocket connections (同一用户可多端登录)
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    def get_online_users(self) -> List[int]:
        return list(self.active_connections.keys())

    async def send_to_user(self, user_id: int, data: dict):
        """向指定用户的所有连接发送消息"""
        if user_id in self.active_connections:
            disconnected = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect(ws, user_id)

    async def broadcast(self, data: dict, exclude_user_id: int = None):
        """广播消息给所有在线用户"""
        for uid, connections in list(self.active_connections.items()):
            if exclude_user_id and uid == exclude_user_id:
                continue
            for ws in connections:
                try:
                    await ws.send_json(data)
                except Exception:
                    pass


# 全局单例
manager = ConnectionManager()
