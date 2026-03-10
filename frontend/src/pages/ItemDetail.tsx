import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { itemsApi, exchangesApi } from "../api";
import type { Item } from "../types";
import { CONDITION_LABELS, STATUS_LABELS, STATUS_COLORS } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { MapPin, Clock, User, ArrowLeftRight, MessageCircle, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { API_BASE } from "../api/client";
import CommentSection from "../components/CommentSection";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeMessage, setExchangeMessage] = useState("");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [selectedOfferItem, setSelectedOfferItem] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    itemsApi.get(Number(id)).then((res) => {
      setItem(res.data);
      setLoading(false);
    }).catch(() => {
      toast.error("物品不存在");
      navigate("/");
    });
  }, [id]);

  useEffect(() => {
    if (user && showExchangeModal) {
      itemsApi.list({ owner_id: user.id, status: "available" }).then((res) => {
        setMyItems(res.data.items.filter((i: Item) => i.id !== item?.id));
      });
    }
  }, [showExchangeModal, user]);

  const images: string[] = (() => {
    try { return JSON.parse(item?.images || "[]"); } catch { return []; }
  })();

  const handleDelete = async () => {
    if (!confirm("确定要删除此物品吗？")) return;
    try {
      await itemsApi.delete(Number(id));
      toast.success("物品已删除");
      navigate("/");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleExchangeSubmit = async () => {
    if (!item) return;
    setSubmitting(true);
    try {
      await exchangesApi.create({
        target_item_id: item.id,
        offer_item_id: selectedOfferItem || undefined,
        message: exchangeMessage,
      });
      toast.success("交换申请已发送！");
      setShowExchangeModal(false);
      // 刷新物品状态
      const res = await itemsApi.get(item.id);
      setItem(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "申请失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-80 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isOwner = user?.id === item.owner_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ChevronLeft size={16} /> 返回
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 图片区域 */}
        <div>
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {images.length > 0 ? (
              <>
                <img
                  src={`${API_BASE}${images[imgIndex]}`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {/* 缩略图 */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIndex ? "border-primary-500" : "border-transparent"}`}
                >
                  <img src={`${API_BASE}${img}`} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 详情区域 */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
            <span className={`flex-shrink-0 text-sm font-medium px-3 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
              {STATUS_LABELS[item.status]}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">{item.category}</span>
            <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
              {CONDITION_LABELS[item.condition] || item.condition}
            </span>
          </div>

          {item.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">物品描述</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          {item.expected_exchange && (
            <div className="bg-primary-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-primary-700 mb-1 flex items-center gap-1">
                <ArrowLeftRight size={14} /> 期望换取
              </h3>
              <p className="text-primary-800 text-sm">{item.expected_exchange}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {item.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={14} /> {timeAgo(item.created_at)}
            </span>
          </div>

          {/* 发布者信息 */}
          <div className="border-t pt-4">
            <Link to={`/user/${item.owner_id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.owner.avatar ? (
                  <img src={`${API_BASE}${item.owner.avatar}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-primary-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.owner.username}</p>
                <p className="text-xs text-gray-400">{item.owner.location || "未知地区"}</p>
              </div>
            </Link>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            {isOwner ? (
              <>
                <Link to={`/items/${item.id}/edit`} className="btn-secondary flex-1 text-center text-sm">
                  编辑物品
                </Link>
                <button onClick={handleDelete} className="btn-danger flex items-center gap-1 text-sm px-4">
                  <Trash2 size={16} /> 删除
                </button>
              </>
            ) : (
              <>
                {item.status === "available" && user && (
                  <button
                    onClick={() => setShowExchangeModal(true)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <ArrowLeftRight size={18} /> 申请交换
                  </button>
                )}
                {user && (
                  <Link
                    to={`/chat?user=${item.owner_id}`}
                    className="btn-secondary flex items-center gap-2 px-4"
                  >
                    <MessageCircle size={18} /> 联系
                  </Link>
                )}
                {!user && (
                  <Link to="/login" className="btn-primary flex-1 text-center">
                    登录后申请交换
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 评论区 */}
      <div className="mt-8">
        <CommentSection itemId={item.id} itemOwnerId={item.owner_id} />
      </div>

      {/* 交换申请弹窗 */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">发起交换申请</h2>
            <p className="text-sm text-gray-500 mb-4">
              申请交换：<span className="font-medium text-gray-900">{item.title}</span>
            </p>

            {myItems.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择提供的物品（可选）
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="offer"
                      checked={selectedOfferItem === null}
                      onChange={() => setSelectedOfferItem(null)}
                      className="text-primary-600"
                    />
                    <span className="text-sm text-gray-500">不指定物品</span>
                  </label>
                  {myItems.map((mi) => (
                    <label key={mi.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="offer"
                        checked={selectedOfferItem === mi.id}
                        onChange={() => setSelectedOfferItem(mi.id)}
                        className="text-primary-600"
                      />
                      <span className="text-sm">{mi.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">留言（可选）</label>
              <textarea
                value={exchangeMessage}
                onChange={(e) => setExchangeMessage(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="向对方介绍一下自己或说明交换意愿..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExchangeModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleExchangeSubmit}
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? "提交中..." : "确认申请"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
