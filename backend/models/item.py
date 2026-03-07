from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from core.database import Base


class ItemStatus(str, enum.Enum):
    available = "available"
    exchanging = "exchanging"
    exchanged = "exchanged"


class ItemCondition(str, enum.Enum):
    new = "new"
    like_new = "like_new"
    good = "good"
    fair = "fair"
    poor = "poor"


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False, index=True)
    description = Column(Text, default="")
    category = Column(String(50), default="其他")
    condition = Column(String(20), default=ItemCondition.good)
    images = Column(Text, default="")          # JSON 字符串存储图片路径列表
    expected_exchange = Column(Text, default="")  # 期望换取的物品描述
    location = Column(String(100), default="")
    status = Column(String(20), default=ItemStatus.available)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="items")
    exchange_requests = relationship("ExchangeRequest", foreign_keys="ExchangeRequest.target_item_id", back_populates="target_item", cascade="all, delete-orphan")
