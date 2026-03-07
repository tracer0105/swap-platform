from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional
from core.database import get_db, SessionLocal
from core.security import decode_token, get_current_user
from core.ws_manager import manager
from models.user import User
from models.exchange import Message
from schemas.exchange import MessageOut, ConversationOut
from schemas.user import UserPublic
import json
from datetime import datetime

router = APIRouter(tags=["聊天"])


# ─── WebSocket 端点 ────────────────────────────────────────────────────────────

@router.websocket("/ws/chat/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    """
    WebSocket 连接端点，通过 URL 中的 token 进行身份验证。
    消息格式（JSON）：
      发送: {"type": "message", "receiver_id": 2, "content": "你好", "msg_type": "text"}
      接收: {"type": "message", "data": {...MessageOut...}}
             {"type": "read", "sender_id": 2}
             {"type": "online_status", "user_id": 2, "online": true}
    """
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001)
            return

        await manager.connect(websocket, user_id)

        # 通知其他在线用户该用户上线
        await manager.broadcast(
            {"type": "online_status", "user_id": user_id, "online": True},
            exclude_user_id=user_id,
        )

        # 发送当前在线用户列表给新连接的用户
        await websocket.send_json({
            "type": "online_users",
            "user_ids": manager.get_online_users(),
        })

        try:
            while True:
                raw = await websocket.receive_text()
                try:
                    data = json.loads(raw)
                except json.JSONDecodeError:
                    await websocket.send_json({"type": "error", "message": "无效的消息格式"})
                    continue

                msg_type = data.get("type")

                if msg_type == "message":
                    receiver_id = data.get("receiver_id")
                    content = data.get("content", "").strip()
                    m_type = data.get("msg_type", "text")

                    if not receiver_id or not content:
                        await websocket.send_json({"type": "error", "message": "消息内容不能为空"})
                        continue

                    receiver = db.query(User).filter(User.id == receiver_id).first()
                    if not receiver:
                        await websocket.send_json({"type": "error", "message": "接收方用户不存在"})
                        continue

                    # 持久化消息
                    msg = Message(
                        sender_id=user_id,
                        receiver_id=receiver_id,
                        content=content,
                        msg_type=m_type,
                        is_read="false",
                    )
                    db.add(msg)
                    db.commit()
                    db.refresh(msg)

                    msg_data = _serialize_message(msg, db)

                    # 推送给接收方
                    await manager.send_to_user(receiver_id, {"type": "message", "data": msg_data})
                    # 回显给发送方（确认发送成功）
                    await websocket.send_json({"type": "message_sent", "data": msg_data})

                elif msg_type == "read":
                    # 标记某用户发来的消息为已读
                    sender_id = data.get("sender_id")
                    if sender_id:
                        db.query(Message).filter(
                            Message.sender_id == sender_id,
                            Message.receiver_id == user_id,
                            Message.is_read == "false",
                        ).update({"is_read": "true"})
                        db.commit()
                        # 通知发送方消息已读
                        await manager.send_to_user(sender_id, {
                            "type": "read",
                            "reader_id": user_id,
                        })

                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            pass
    finally:
        manager.disconnect(websocket, user_id)
        await manager.broadcast(
            {"type": "online_status", "user_id": user_id, "online": False},
            exclude_user_id=user_id,
        )
        db.close()


# ─── REST API ─────────────────────────────────────────────────────────────────

@router.get("/api/chat/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取当前用户的所有会话列表（每个会话取最新一条消息）"""
    # 找出所有与当前用户有过对话的用户 ID
    sent = db.query(Message.receiver_id).filter(Message.sender_id == current_user.id).distinct()
    received = db.query(Message.sender_id).filter(Message.receiver_id == current_user.id).distinct()

    partner_ids = set()
    for row in sent:
        partner_ids.add(row[0])
    for row in received:
        partner_ids.add(row[0])

    conversations = []
    for pid in partner_ids:
        last_msg = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == pid),
                and_(Message.sender_id == pid, Message.receiver_id == current_user.id),
            )
        ).order_by(Message.created_at.desc()).first()

        unread_count = db.query(Message).filter(
            Message.sender_id == pid,
            Message.receiver_id == current_user.id,
            Message.is_read == "false",
        ).count()

        partner = db.query(User).filter(User.id == pid).first()
        if last_msg and partner:
            conversations.append({
                "partner": {
                    "id": partner.id,
                    "username": partner.username,
                    "avatar": partner.avatar,
                    "bio": partner.bio,
                    "location": partner.location,
                    "created_at": partner.created_at.isoformat(),
                },
                "last_message": _serialize_message(last_msg, db),
                "unread_count": unread_count,
                "online": manager.is_online(pid),
            })

    conversations.sort(key=lambda x: x["last_message"]["created_at"], reverse=True)
    return conversations


@router.get("/api/chat/messages/{partner_id}")
async def get_messages(
    partner_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取与某用户的历史消息"""
    query = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == partner_id),
            and_(Message.sender_id == partner_id, Message.receiver_id == current_user.id),
        )
    )
    total = query.count()
    messages = query.order_by(Message.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    messages = list(reversed(messages))

    # 标记为已读
    db.query(Message).filter(
        Message.sender_id == partner_id,
        Message.receiver_id == current_user.id,
        Message.is_read == "false",
    ).update({"is_read": "true"})
    db.commit()

    return {
        "messages": [_serialize_message(m, db) for m in messages],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/api/chat/unread_count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == "false",
    ).count()
    return {"unread_count": count}


def _serialize_message(msg: Message, db) -> dict:
    sender = db.query(User).filter(User.id == msg.sender_id).first()
    receiver = db.query(User).filter(User.id == msg.receiver_id).first()
    return {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "msg_type": msg.msg_type,
        "is_read": msg.is_read,
        "created_at": msg.created_at.isoformat(),
        "sender": {
            "id": sender.id,
            "username": sender.username,
            "avatar": sender.avatar,
            "bio": sender.bio,
            "location": sender.location,
            "created_at": sender.created_at.isoformat(),
        } if sender else None,
        "receiver": {
            "id": receiver.id,
            "username": receiver.username,
            "avatar": receiver.avatar,
            "bio": receiver.bio,
            "location": receiver.location,
            "created_at": receiver.created_at.isoformat(),
        } if receiver else None,
    }
