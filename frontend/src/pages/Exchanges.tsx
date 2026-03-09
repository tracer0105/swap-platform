import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { exchangesApi } from "../api";
import type { ExchangeRequest, Item } from "../types";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, CONDITION_LABELS, STATUS_LABELS, STATUS_COLORS } from "../types";
import toast from "react-hot-toast";
import { ArrowLeftRight, Clock, Check, X, Ban, MessageCircle, Package, User, MapPin } from "lucide-react";
import { API_BASE } from "../api/client";
import { useAuthStore } from "../store/useAuthStore";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) return `${Math.floor(diff / 60000)}分钟前`;
    return `${hours}小时前`;
  }
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function getFirstImage(images: string): string | null {
  try {
    const arr = JSON.parse(images);
    if (arr.length > 0) return `${API_BASE}${arr[0]}`;
  } catch {}
  return null;
}

/** 单个物品展示卡片（用于申请详情中的物品对比） */
function ItemMiniCard({ item, label }: { item: Item; label: string }) {
  const img = getFirstImage(item.images);
  return (
    <Link
      to={`/items/${item.id}`}
      className="flex-1 min-w-0 group"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-sm transition-all">
        {/* 图片 */}
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
          {img ? (
            <img src={img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package size={28} />
            </div>
          )}
          <span className={`absolute top-1.5 right-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status]}`}>
            {STATUS_LABELS[item.status]}
          </span>
        </div>
        {/* 信息 */}
        <div className="p-2.5">
          <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">{item.title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
              {CONDITION_LABELS[item.condition] || item.condition}
            </span>
            <span className="text-xs text-gray-400">{item.category}</span>
          </div>
          {item.expected_exchange && (
            <p className="text-xs text-primary-600 mt-1 truncate">换：{item.expected_exchange}</p>
          )}
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
          {(item.location || item.owner?.location) && (
            <p className="flex items-center gap-0.5 text-xs text-gray-400 mt-1.5">
              <MapPin size={10} />
              {item.location || item.owner?.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Exchanges() {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<ExchangeRequest[]>([]);
  const [sent, setSent] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const user = useAuthStore((s) => s.user);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [recRes, sentRes] = await Promise.all([
        exchangesApi.getReceived(),
        exchangesApi.getSent(),
      ]);
      setReceived(recRes.data);
      setSent(sentRes.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "加载失败，请刷新重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReceived([]);
    setSent([]);
    fetchAll();
  }, [user?.id]);

  const handleAccept = async (id: number) => {
    try {
      await exchangesApi.accept(id);
      toast.success("已接受交换申请");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "操作失败");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await exchangesApi.reject(id);
      toast.success("已拒绝交换申请");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "操作失败");
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("确定取消此申请吗？")) return;
    try {
      await exchangesApi.cancel(id);
      toast.success("申请已取消");
      fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "操作失败");
    }
  };

  const currentList = tab === "received" ? received : sent;
  const pendingCount = received.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ArrowLeftRight size={24} /> 交换申请
      </h1>

      {/* 标签切换 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab("received")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            tab === "received" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          收到的申请
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("sent")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "sent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          发出的申请
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-30" />
          <p>暂无{tab === "received" ? "收到的" : "发出的"}申请</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((req) => {
            const isExpanded = expandedId === req.id;
            const targetImg = getFirstImage(req.target_item.images);
            const counterpart = tab === "received" ? req.requester : req.owner;
            const counterpartId = tab === "received" ? req.requester_id : req.owner_id;

            return (
              <div key={req.id} className="card overflow-hidden">
                {/* ── 顶部摘要行（可点击展开/折叠） ── */}
                <button
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* 目标物品缩略图 */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {targetImg ? (
                        <img src={targetImg} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={20} />
                        </div>
                      )}
                    </div>

                    {/* 中间信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">
                          {req.target_item.title}
                        </span>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${REQUEST_STATUS_COLORS[req.status]}`}>
                          {REQUEST_STATUS_LABELS[req.status]}
                        </span>
                      </div>

                      {/* 对方用户 */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {counterpart.avatar ? (
                            <img src={`${API_BASE}${counterpart.avatar}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={10} className="text-primary-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {tab === "received" ? "申请人：" : "物品主："}
                          <Link
                            to={`/user/${counterpartId}`}
                            className="hover:text-primary-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {counterpart.username}
                          </Link>
                        </span>
                        {counterpart.location && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-400">
                            <MapPin size={10} />{counterpart.location}
                          </span>
                        )}
                      </div>

                      {/* 提供物品摘要 */}
                      {req.offer_item ? (
                        <p className="text-xs text-primary-600 mt-0.5 truncate">
                          以「{req.offer_item.title}」换取
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">无偿申请（未提供交换物品）</p>
                      )}
                    </div>

                    {/* 右侧：时间 + 展开箭头 */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <Clock size={11} /> {timeAgo(req.created_at)}
                      </p>
                      <span className={`text-xs text-gray-400 mt-1 inline-block transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    </div>
                  </div>
                </button>

                {/* ── 展开详情区域 ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">

                    {/* 双方物品对比 */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1">
                        <ArrowLeftRight size={12} /> 交换物品详情
                      </p>
                      <div className="flex gap-3 items-start">
                        <ItemMiniCard
                          item={req.target_item}
                          label={tab === "received" ? "我的物品（被申请）" : "对方物品（申请目标）"}
                        />
                        {req.offer_item && (
                          <>
                            <div className="flex-shrink-0 flex items-center justify-center pt-8">
                              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                                <ArrowLeftRight size={14} className="text-primary-600" />
                              </div>
                            </div>
                            <ItemMiniCard
                              item={req.offer_item}
                              label={tab === "received" ? "对方提供（申请方物品）" : "我提供的物品"}
                            />
                          </>
                        )}
                        {!req.offer_item && (
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-400 mb-1.5">
                              {tab === "received" ? "对方提供" : "我提供的物品"}
                            </p>
                            <div className="border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 aspect-[4/3]">
                              <Package size={24} className="mb-1 opacity-40" />
                              <p className="text-xs">无偿申请</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 留言 */}
                    {req.message && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-400 mb-1">申请留言</p>
                        <p className="text-sm text-gray-700 leading-relaxed">"{req.message}"</p>
                      </div>
                    )}

                    {/* 申请时间 */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>申请时间：{new Date(req.created_at).toLocaleString("zh-CN")}</span>
                      {req.updated_at !== req.created_at && (
                        <span>更新时间：{new Date(req.updated_at).toLocaleString("zh-CN")}</span>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div className="flex gap-2">
                        {tab === "received" && req.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="flex items-center gap-1.5 text-sm bg-green-600 text-white hover:bg-green-700 px-4 py-1.5 rounded-lg transition-colors font-medium"
                            >
                              <Check size={14} /> 接受交换
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="flex items-center gap-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 px-4 py-1.5 rounded-lg transition-colors"
                            >
                              <X size={14} /> 拒绝
                            </button>
                          </>
                        )}
                        {tab === "sent" && req.status === "pending" && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-1.5 rounded-lg transition-colors"
                          >
                            <Ban size={14} /> 取消申请
                          </button>
                        )}
                      </div>

                      {/* 联系对方 */}
                      {(req.status === "accepted" || req.status === "pending") && (
                        <Link
                          to={`/chat?user=${counterpartId}`}
                          className="flex items-center gap-1.5 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle size={14} /> 联系对方
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
