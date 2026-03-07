from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class ExchangeRequest(Base):
    __tablename__ = "exchange_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    offer_item_id = Column(Integer, ForeignKey("items.id"), nullable=True)  # 提供的物品（可选）
    message = Column(Text, default="")
    status = Column(String(20), default="pending")  # pending / accepted / rejected / cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_requests")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="received_requests")
    target_item = relationship("Item", foreign_keys=[target_item_id], back_populates="exchange_requests")
    offer_item = relationship("Item", foreign_keys=[offer_item_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    msg_type = Column(String(20), default="text")   # text / image
    is_read = Column(String(5), default="false")
    created_at = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
