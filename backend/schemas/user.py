from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserUpdate(BaseModel):
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar: Optional[str] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    avatar: str
    bio: str
    location: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    id: int
    username: str
    avatar: str
    bio: str
    location: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class LoginForm(BaseModel):
    username: str
    password: str
