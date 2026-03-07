import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { exchangesApi } from "../api";
import type { ExchangeRequest } from "../types";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from "../types";
import toast from "react-hot-toast";
import { ArrowLeftRight, Clock, Check, X, Ban } from "lucide-react";
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

export default function Exchanges() {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [received, setReceived] = useState<ExchangeRequest[]>([]);
  const [sent, setSent] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(false);

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

  // 每次用户切换时重新加载数据
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
        <div className="space-y-3">
          {currentList.map((req) => {
            const images = (() => { try { return JSON.parse(req.target_item.images); } catch { return []; } })();
            const firstImg = images[0];
            return (
              <div key={req.id} className="card p-4">
                <div className="flex gap-4">
                  {/* 物品图片 */}
                  <Link to={`/items/${req.target_item_id}`} className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {firstImg ? (
                        <img src={`${API_BASE}${firstImg}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ArrowLeftRight size={20} />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/items/${req.target_item_id}`} className="font-medium text-gray-900 hover:text-primary-600 truncate text-sm">
                        {req.target_item.title}
                      </Link>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${REQUEST_STATUS_COLORS[req.status]}`}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mt-0.5">
                      {tab === "received"
                        ? `申请人：${req.requester.username}`
                        : `物品主：${req.owner.username}`}
                    </p>

                    {req.message && (
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-1.5 line-clamp-2">
                        "{req.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> {timeAgo(req.created_at)}
                      </span>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        {tab === "received" && req.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              <Check size={12} /> 接受
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors"
                            >
                              <X size={12} /> 拒绝
                            </button>
                          </>
                        )}
                        {tab === "sent" && req.status === "pending" && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Ban size={12} /> 取消
                          </button>
                        )}
                        {tab === "received" && req.status === "accepted" && (
                          <Link
                            to={`/chat?user=${req.requester_id}`}
                            className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            联系对方
                          </Link>
                        )}
                        {tab === "sent" && req.status === "accepted" && (
                          <Link
                            to={`/chat?user=${req.owner_id}`}
                            className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 px-2 py-1 rounded-lg transition-colors"
                          >
                            联系对方
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
