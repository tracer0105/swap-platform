import { Link } from "react-router-dom";
import type { Item } from "../types";
import { CONDITION_LABELS, STATUS_LABELS, STATUS_COLORS } from "../types";
import { MapPin, Clock, User } from "lucide-react";
import { API_BASE } from "../api/client";

interface Props {
  item: Item;
}

function getFirstImage(images: string): string | null {
  try {
    const arr = JSON.parse(images);
    if (arr.length > 0) return `${API_BASE}${arr[0]}`;
  } catch {}
  return null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

export default function ItemCard({ item }: Props) {
  const firstImage = getFirstImage(item.images);

  return (
    <Link to={`/items/${item.id}`} className="card hover:shadow-md transition-shadow duration-200 group block">
      {/* 图片区域 */}
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        {firstImage ? (
          <img
            src={firstImage}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* 状态标签 */}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
      </div>

      {/* 信息区域 */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate text-sm">{item.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {CONDITION_LABELS[item.condition] || item.condition}
          </span>
          <span className="text-xs text-gray-400">{item.category}</span>
        </div>
        {item.expected_exchange && (
          <p className="text-xs text-primary-600 mt-1.5 truncate">
            换：{item.expected_exchange}
          </p>
        )}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1 truncate">
            <MapPin size={11} />
            <span className="truncate">{item.location || item.owner.location || "未知地区"}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Clock size={11} />
            <span>{timeAgo(item.created_at)}</span>
          </div>
        </div>
        {/* 发布者信息 */}
        <Link
          to={`/user/${item.owner_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100 hover:text-primary-600 transition-colors"
        >
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {item.owner.avatar ? (
              <img src={`${API_BASE}${item.owner.avatar}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={12} className="text-primary-500" />
            )}
          </div>
          <span className="text-xs text-gray-500 truncate hover:text-primary-600">{item.owner.username}</span>
        </Link>
      </div>
    </Link>
  );
}
