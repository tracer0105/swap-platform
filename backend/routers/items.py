from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.item import Item
from schemas.item import ItemCreate, ItemUpdate, ItemOut, ItemList
import aiofiles
import os
import uuid
import json

router = APIRouter(prefix="/api/items", tags=["物品"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

CATEGORIES = ["电子产品", "书籍", "服装", "家居", "运动", "玩具", "乐器", "工具", "其他"]
CONDITIONS = {
    "new": "全新",
    "like_new": "几乎全新",
    "good": "良好",
    "fair": "一般",
    "poor": "较差",
}


@router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES, "conditions": CONDITIONS}


@router.get("", response_model=ItemList)
async def list_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category: Optional[str] = None,
    condition: Optional[str] = None,
    keyword: Optional[str] = None,
    status: Optional[str] = "available",
    owner_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Item)
    if status:
        query = query.filter(Item.status == status)
    if category:
        query = query.filter(Item.category == category)
    if condition:
        query = query.filter(Item.condition == condition)
    if keyword:
        query = query.filter(
            or_(Item.title.contains(keyword), Item.description.contains(keyword))
        )
    if owner_id:
        query = query.filter(Item.owner_id == owner_id)

    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ItemList(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ItemOut)
async def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = Item(
        **item_data.model_dump(),
        owner_id=current_user.id,
        images="[]",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    return item


@router.put("/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: int,
    update_data: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此物品")
    for field, value in update_data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此物品")
    db.delete(item)
    db.commit()
    return {"message": "物品已删除"}


@router.post("/{item_id}/images")
async def upload_item_images(
    item_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    if item.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此物品")

    existing = json.loads(item.images or "[]")
    new_paths = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".webp"]:
            continue
        filename = f"item_{item_id}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        async with aiofiles.open(filepath, "wb") as f:
            content = await file.read()
            await f.write(content)
        new_paths.append(f"/static/uploads/{filename}")

    item.images = json.dumps(existing + new_paths)
    db.commit()
    db.refresh(item)
    return {"images": json.loads(item.images)}
