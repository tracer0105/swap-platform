from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from schemas.user import UserPublic


class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None      # 若为回复，填父评论 id
    reply_to_id: Optional[int] = None    # 回复的目标用户 id


class CommentOut(BaseModel):
    id: int
    item_id: int
    author_id: int
    parent_id: Optional[int]
    reply_to_id: Optional[int]
    content: str
    created_at: datetime
    author: UserPublic
    reply_to: Optional[UserPublic] = None
    replies: List["CommentOut"] = []

    class Config:
        from_attributes = True


CommentOut.model_rebuild()
