from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from core.security import get_current_user
from models.user import User
from models.item import Item, ItemStatus
from models.exchange import ExchangeRequest
from schemas.exchange import ExchangeRequestCreate, ExchangeRequestOut

router = APIRouter(prefix="/api/exchanges", tags=["交换申请"])


@router.post("", response_model=ExchangeRequestOut)
async def create_exchange_request(
    req_data: ExchangeRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_item = db.query(Item).filter(Item.id == req_data.target_item_id).first()
    if not target_item:
        raise HTTPException(status_code=404, detail="目标物品不存在")
    if target_item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能申请交换自己的物品")
    if target_item.status != ItemStatus.available:
        raise HTTPException(status_code=400, detail="该物品当前不可交换")

    # 检查是否已有待处理的申请
    existing = db.query(ExchangeRequest).filter(
        ExchangeRequest.requester_id == current_user.id,
        ExchangeRequest.target_item_id == req_data.target_item_id,
        ExchangeRequest.status == "pending",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="已有待处理的交换申请")

    if req_data.offer_item_id:
        offer_item = db.query(Item).filter(Item.id == req_data.offer_item_id).first()
        if not offer_item or offer_item.owner_id != current_user.id:
            raise HTTPException(status_code=400, detail="提供的物品不存在或不属于您")
        if offer_item.status != ItemStatus.available:
            raise HTTPException(status_code=400, detail="您提供的物品当前不可用于交换")

    exchange_req = ExchangeRequest(
        requester_id=current_user.id,
        owner_id=target_item.owner_id,
        target_item_id=req_data.target_item_id,
        offer_item_id=req_data.offer_item_id,
        message=req_data.message,
    )
    db.add(exchange_req)
    # 将目标物品状态改为交换中
    target_item.status = ItemStatus.exchanging
    # 将申请方提供的物品也改为交换中（锁定，防止重复申请）
    if req_data.offer_item_id:
        offer_item.status = ItemStatus.exchanging
    db.commit()
    db.refresh(exchange_req)
    return exchange_req


@router.get("/sent", response_model=list[ExchangeRequestOut])
async def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = db.query(ExchangeRequest).filter(
        ExchangeRequest.requester_id == current_user.id
    ).order_by(ExchangeRequest.created_at.desc()).all()
    return requests


@router.get("/received", response_model=list[ExchangeRequestOut])
async def get_received_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = db.query(ExchangeRequest).filter(
        ExchangeRequest.owner_id == current_user.id
    ).order_by(ExchangeRequest.created_at.desc()).all()
    return requests


@router.put("/{request_id}/accept", response_model=ExchangeRequestOut)
async def accept_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="申请不存在")
    if req.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此申请")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="申请状态不可更改")

    req.status = "accepted"
    # 将目标物品标记为已交换
    target_item = db.query(Item).filter(Item.id == req.target_item_id).first()
    if target_item:
        target_item.status = ItemStatus.exchanged
    # 将申请方提供的物品也标记为已交换
    if req.offer_item_id:
        offer_item = db.query(Item).filter(Item.id == req.offer_item_id).first()
        if offer_item:
            offer_item.status = ItemStatus.exchanged
    # 拒绝其他待处理申请
    other_requests = db.query(ExchangeRequest).filter(
        ExchangeRequest.target_item_id == req.target_item_id,
        ExchangeRequest.id != request_id,
        ExchangeRequest.status == "pending",
    ).all()
    for other in other_requests:
        other.status = "rejected"
    db.commit()
    db.refresh(req)
    return req


@router.put("/{request_id}/reject", response_model=ExchangeRequestOut)
async def reject_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="申请不存在")
    if req.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此申请")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="申请状态不可更改")

    req.status = "rejected"
    # 恢复目标物品为可用状态（如果没有其他待处理申请）
    other_pending = db.query(ExchangeRequest).filter(
        ExchangeRequest.target_item_id == req.target_item_id,
        ExchangeRequest.id != request_id,
        ExchangeRequest.status == "pending",
    ).count()
    if other_pending == 0:
        target_item = db.query(Item).filter(Item.id == req.target_item_id).first()
        if target_item and target_item.status == ItemStatus.exchanging:
            target_item.status = ItemStatus.available
    # 恢复申请方提供的物品为可用状态
    if req.offer_item_id:
        offer_item = db.query(Item).filter(Item.id == req.offer_item_id).first()
        if offer_item and offer_item.status == ItemStatus.exchanging:
            offer_item.status = ItemStatus.available
    db.commit()
    db.refresh(req)
    return req


@router.put("/{request_id}/cancel")
async def cancel_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(ExchangeRequest).filter(ExchangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="申请不存在")
    if req.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作此申请")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="申请状态不可更改")

    req.status = "cancelled"
    # 恢复目标物品为可用状态
    target_item = db.query(Item).filter(Item.id == req.target_item_id).first()
    if target_item and target_item.status == ItemStatus.exchanging:
        target_item.status = ItemStatus.available
    # 恢复申请方提供的物品为可用状态
    if req.offer_item_id:
        offer_item = db.query(Item).filter(Item.id == req.offer_item_id).first()
        if offer_item and offer_item.status == ItemStatus.exchanging:
            offer_item.status = ItemStatus.available
    db.commit()
    return {"message": "申请已取消"}
