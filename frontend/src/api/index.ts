import client from "./client";

// ─── 认证 ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    client.post("/api/auth/register", data),
  login: (data: { username: string; password: string }) =>
    client.post("/api/auth/login", data),
  getMe: () => client.get("/api/auth/me"),
  updateProfile: (data: { bio?: string; location?: string }) =>
    client.put("/api/auth/me", data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return client.post("/api/auth/avatar", form);
  },
  getUserPublic: (userId: number) => client.get(`/api/auth/users/${userId}`),
};

// ─── 物品 ─────────────────────────────────────────────────────────────────────
export const itemsApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    condition?: string;
    keyword?: string;
    status?: string;
    owner_id?: number;
  }) => client.get("/api/items", { params }),
  create: (data: {
    title: string;
    description?: string;
    category?: string;
    condition?: string;
    expected_exchange?: string;
    location?: string;
  }) => client.post("/api/items", data),
  get: (id: number) => client.get(`/api/items/${id}`),
  update: (id: number, data: object) => client.put(`/api/items/${id}`, data),
  delete: (id: number) => client.delete(`/api/items/${id}`),
  uploadImages: (id: number, files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    return client.post(`/api/items/${id}/images`, form);
  },
  getCategories: () => client.get("/api/items/categories"),
};

// ─── 交换申请 ─────────────────────────────────────────────────────────────────
export const exchangesApi = {
  create: (data: {
    target_item_id: number;
    offer_item_id?: number;
    message?: string;
  }) => client.post("/api/exchanges", data),
  getSent: () => client.get("/api/exchanges/sent"),
  getReceived: () => client.get("/api/exchanges/received"),
  accept: (id: number) => client.put(`/api/exchanges/${id}/accept`),
  reject: (id: number) => client.put(`/api/exchanges/${id}/reject`),
  cancel: (id: number) => client.put(`/api/exchanges/${id}/cancel`),
};

// ─── 评论 ─────────────────────────────────────────────────────────────────────
export const commentsApi = {
  list: (itemId: number) => client.get(`/api/comments/item/${itemId}`),
  create: (itemId: number, data: { content: string; parent_id?: number; reply_to_id?: number }) =>
    client.post(`/api/comments/item/${itemId}`, data),
  remove: (commentId: number) => client.delete(`/api/comments/${commentId}`),
};

// ─── 聊天 ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  getConversations: () => client.get("/api/chat/conversations"),
  getMessages: (partnerId: number, page = 1) =>
    client.get(`/api/chat/messages/${partnerId}`, { params: { page } }),
  getUnreadCount: () => client.get("/api/chat/unread_count"),
};
