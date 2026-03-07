import axios from "axios";

// 开发模式：使用 Vite 代理（相对路径），构建后：同域名直接访问
// 不再硬编码 localhost，支持任意域名部署
const API_BASE = import.meta.env.VITE_API_URL || "";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// 请求拦截器：自动附加 token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401（防止切换用户时重复跳转）
let isRedirecting = false;
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      setTimeout(() => { isRedirecting = false; }, 3000);
    }
    return Promise.reject(err);
  }
);

export default client;
export { API_BASE };
