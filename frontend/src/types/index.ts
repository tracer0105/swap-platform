export interface User {
  id: number;
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  location: string;
  created_at: string;
}

export interface Item {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  images: string; // JSON string
  expected_exchange: string;
  location: string;
  status: "available" | "exchanging" | "exchanged";
  owner_id: number;
  owner: User;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRequest {
  id: number;
  requester_id: number;
  owner_id: number;
  target_item_id: number;
  offer_item_id: number | null;
  message: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
  requester: User;
  owner: User;
  target_item: Item;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  msg_type: "text" | "image";
  is_read: string;
  created_at: string;
  sender: User;
  receiver: User;
}

export interface Conversation {
  partner: User;
  last_message: Message;
  unread_count: number;
  online: boolean;
}

export const CONDITION_LABELS: Record<string, string> = {
  new: "全新",
  like_new: "几乎全新",
  good: "良好",
  fair: "一般",
  poor: "较差",
};

export const STATUS_LABELS: Record<string, string> = {
  available: "可交换",
  exchanging: "交换中",
  exchanged: "已交换",
};

export const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  exchanging: "bg-yellow-100 text-yellow-800",
  exchanged: "bg-gray-100 text-gray-800",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  accepted: "已接受",
  rejected: "已拒绝",
  cancelled: "已取消",
};

export const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};
