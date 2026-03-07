import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { authApi, itemsApi } from "../api";
import { useAuthStore } from "../store/useAuthStore";
import type { Item } from "../types";
import ItemCard from "../components/ItemCard";
import toast from "react-hot-toast";
import { User, Camera, MapPin, Edit2, Check, X } from "lucide-react";
import { API_BASE } from "../api/client";

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setBio(user.bio);
      setLocation(user.location);
      itemsApi.list({ owner_id: user.id, status: "" }).then((res) => {
        setMyItems(res.data.items);
        setLoading(false);
      });
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await authApi.uploadAvatar(file);
      updateUser({ avatar: res.data.avatar });
      toast.success("头像已更新");
    } catch {
      toast.error("头像上传失败");
    }
  };

  const saveBio = async () => {
    try {
      await authApi.updateProfile({ bio });
      updateUser({ bio });
      setEditingBio(false);
      toast.success("简介已更新");
    } catch {
      toast.error("更新失败");
    }
  };

  const saveLocation = async () => {
    try {
      await authApi.updateProfile({ location });
      updateUser({ location });
      setEditingLocation(false);
      toast.success("地区已更新");
    } catch {
      toast.error("更新失败");
    }
  };

  if (!user) return null;

  const availableItems = myItems.filter((i) => i.status === "available");
  const exchangedItems = myItems.filter((i) => i.status === "exchanged");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 个人信息卡片 */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* 头像 */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={`${API_BASE}${user.avatar}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-primary-500" />
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Camera size={14} className="text-gray-600" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user.username}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>

            {/* 简介 */}
            <div className="mt-3">
              {editingBio ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input-field text-sm py-1.5 flex-1"
                    placeholder="介绍一下自己..."
                    maxLength={100}
                    autoFocus
                  />
                  <button onClick={saveBio} className="text-green-600 hover:text-green-700 p-1">
                    <Check size={18} />
                  </button>
                  <button onClick={() => { setEditingBio(false); setBio(user.bio); }} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-sm text-gray-600">{user.bio || "暂无简介"}</p>
                  <button
                    onClick={() => setEditingBio(true)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* 地区 */}
            <div className="mt-2">
              {editingLocation ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="input-field text-sm py-1.5 flex-1"
                    placeholder="所在地区..."
                    maxLength={50}
                    autoFocus
                  />
                  <button onClick={saveLocation} className="text-green-600 hover:text-green-700 p-1">
                    <Check size={18} />
                  </button>
                  <button onClick={() => { setEditingLocation(false); setLocation(user.location); }} className="text-gray-400 hover:text-gray-600 p-1">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{user.location || "未设置地区"}</span>
                  <button
                    onClick={() => setEditingLocation(true)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity ml-1"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 统计 */}
          <div className="hidden sm:flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{myItems.length}</p>
              <p className="text-xs text-gray-400">发布物品</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-600">{availableItems.length}</p>
              <p className="text-xs text-gray-400">可交换</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{exchangedItems.length}</p>
              <p className="text-xs text-gray-400">已交换</p>
            </div>
          </div>
        </div>
      </div>

      {/* 我的物品 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">我的物品</h2>
        <Link to="/publish" className="btn-primary text-sm py-1.5 px-4">
          + 发布物品
        </Link>
      </div>

      {loading ? (
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
      ) : myItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-3">还没有发布任何物品</p>
          <Link to="/publish" className="btn-primary">发布第一件物品</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {myItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
