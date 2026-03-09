from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from schemas.user import UserPublic
from schemas.item import ItemOut


class ExchangeRequestCreate(BaseModel):
    target_item_id: int
    offer_item_id: Optional[int] = None
    message: Optional[str] = ""


class ExchangeRequestOut(BaseModel):
    id: int
    requester_id: int
    owner_id: int
    target_item_id: int
    offer_item_id: Optional[int]
    message: str
    status: str
    created_at: datetime
    updated_at: datetime
    requester: UserPublic
    owner: UserPublic
    target_item: ItemOut
    offer_item: Optional[ItemOut] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    msg_type: Optional[str] = "text"


class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    msg_type: str
    is_read: str
    created_at: datetime
    sender: UserPublic
    receiver: UserPublic

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    partner: UserPublic
    last_message: MessageOut
    unread_count: int
