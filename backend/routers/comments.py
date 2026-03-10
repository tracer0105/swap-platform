from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.item import Item
from models.comment import Comment
from schemas.comment import CommentCreate, CommentOut
from typing import List

router = APIRouter(prefix="/api/comments", tags=["评论"])


@router.get("/item/{item_id}", response_model=List[CommentOut])
async def get_comments(
    item_id: int,
    db: Session = Depends(get_db),
):
    """获取某物品的所有顶级评论（含嵌套回复）"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")
    # 只查顶级评论，replies 通过 relationship 自动加载
    comments = (
        db.query(Comment)
        .filter(Comment.item_id == item_id, Comment.parent_id == None)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments


@router.post("/item/{item_id}", response_model=CommentOut)
async def create_comment(
    item_id: int,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """发表评论或回复"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="物品不存在")

    if not data.content.strip():
        raise HTTPException(status_code=400, detail="评论内容不能为空")
    if len(data.content) > 500:
        raise HTTPException(status_code=400, detail="评论内容不能超过 500 字")

    # 若是回复，校验父评论存在且属于同一物品
    if data.parent_id:
        parent = db.query(Comment).filter(Comment.id == data.parent_id).first()
        if not parent or parent.item_id != item_id:
            raise HTTPException(status_code=400, detail="父评论不存在")

    comment = Comment(
        item_id=item_id,
        author_id=current_user.id,
        parent_id=data.parent_id,
        reply_to_id=data.reply_to_id,
        content=data.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除自己的评论（物品主也可删除）"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")

    item = db.query(Item).filter(Item.id == comment.item_id).first()
    # 只有评论作者或物品主可以删除
    if comment.author_id != current_user.id and (not item or item.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="无权删除此评论")

    db.delete(comment)
    db.commit()
    return {"message": "评论已删除"}
