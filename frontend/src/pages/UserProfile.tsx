import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { authApi, itemsApi } from "../api";
import { useAuthStore } from "../store/useAuthStore";
import type { Item } from "../types";
import ItemCard from "../components/ItemCard";
import toast from "react-hot-toast";
import { User, MapPin, MessageCircle, Package, Calendar } from "lucide-react";
import { API_BASE } from "../api/client";

interface PublicUser {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  created_at: string;
  total_items: number;
  exchanged_count: number;
}

function joinedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [tab, setTab] = useState<"available" | "exchanged">("available");
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // 若访问自己的主页，跳转到 /profile
  useEffect(() => {
    if (currentUser && String(currentUser.id) === userId) {
      navigate("/profile", { replace: true });
    }
  }, [currentUser, userId]);

  // 加载用户信息
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    authApi
      .getUserPublic(Number(userId))
      .then((res) => {
        setProfileUser(res.data);
      })
      .catch(() => {
        toast.error("用户不存在");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // 加载物品列表
  useEffect(() => {
    if (!userId) return;
    setItemsLoading(true);
    itemsApi
      .list({ owner_id: Number(userId), status: tab === "available" ? "available" : "exchanged" })
      .then((res) => setItems(res.data.items))
      .catch(() => setItems([]))
      .finally(() => setItemsLoading(false));
  }, [userId, tab]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 flex justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="card p-6 flex gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 用户信息卡片 */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* 头像 */}
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profileUser.avatar ? (
              <img
                src={`${API_BASE}${profileUser.avatar}`}
                alt={profileUser.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} className="text-primary-500" />
            )}
          </div>

          {/* 基本信息 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{profileUser.username}</h1>

            {profileUser.bio && (
              <p className="text-sm text-gray-600 mt-1.5">{profileUser.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              {profileUser.location && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={12} />
                  {profileUser.location}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar size={12} />
                {joinedDate(profileUser.created_at)} 加入
              </span>
            </div>

            {/* 联系按钮（仅登录用户可见） */}
            {currentUser && (
              <div className="mt-3">
                <Link
                  to={`/chat?user=${profileUser.id}`}
                  className="inline-flex items-center gap-1.5 btn-secondary text-sm py-1.5 px-3"
                >
                  <MessageCircle size={15} />
                  发消息
                </Link>
              </div>
            )}
          </div>

          {/* 统计数据 */}
          <div className="hidden sm:flex gap-6 text-center flex-shrink-0">
            <div>
              <p className="text-2xl font-bold text-gray-900">{profileUser.total_items}</p>
              <p className="text-xs text-gray-400">发布物品</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {profileUser.total_items - profileUser.exchanged_count}
              </p>
              <p className="text-xs text-gray-400">可交换</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{profileUser.exchanged_count}</p>
              <p className="text-xs text-gray-400">已交换</p>
            </div>
          </div>
        </div>

        {/* 移动端统计 */}
        <div className="sm:hidden flex gap-4 mt-4 pt-4 border-t border-gray-100 text-center">
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-900">{profileUser.total_items}</p>
            <p className="text-xs text-gray-400">发布物品</p>
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-primary-600">
              {profileUser.total_items - profileUser.exchanged_count}
            </p>
            <p className="text-xs text-gray-400">可交换</p>
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-500">{profileUser.exchanged_count}</p>
            <p className="text-xs text-gray-400">已交换</p>
          </div>
        </div>
      </div>

      {/* 物品列表 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">TA 的物品</h2>
        {/* Tab 切换 */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("available")}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              tab === "available"
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            可交换
          </button>
          <button
            onClick={() => setTab("exchanged")}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              tab === "exchanged"
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            已交换
          </button>
        </div>
      </div>

      {itemsLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>{tab === "available" ? "暂无可交换的物品" : "暂无已交换的物品"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
