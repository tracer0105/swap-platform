from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)  # 回复的父评论
    reply_to_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # 回复的目标用户
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User", foreign_keys=[author_id])
    reply_to = relationship("User", foreign_keys=[reply_to_id])
    replies = relationship("Comment", foreign_keys=[parent_id], back_populates="parent", cascade="all, delete-orphan")
    parent = relationship("Comment", foreign_keys=[parent_id], back_populates="replies", remote_side=[id])
