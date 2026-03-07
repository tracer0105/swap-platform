from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    avatar = Column(String(300), default="")
    bio = Column(Text, default="")
    location = Column(String(100), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
    sent_requests = relationship("ExchangeRequest", foreign_keys="ExchangeRequest.requester_id", back_populates="requester")
    received_requests = relationship("ExchangeRequest", foreign_keys="ExchangeRequest.owner_id", back_populates="owner")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
