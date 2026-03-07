from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from schemas.user import UserPublic


class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    category: Optional[str] = "其他"
    condition: Optional[str] = "good"
    expected_exchange: Optional[str] = ""
    location: Optional[str] = ""


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    expected_exchange: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None


class ItemOut(BaseModel):
    id: int
    title: str
    description: str
    category: str
    condition: str
    images: str
    expected_exchange: str
    location: str
    status: str
    owner_id: int
    owner: UserPublic
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ItemList(BaseModel):
    items: List[ItemOut]
    total: int
    page: int
    page_size: int
