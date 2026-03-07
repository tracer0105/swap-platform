import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ArrowLeftRight } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("请填写用户名和密码");
      return;
    }
    try {
      await login(username, password);
      toast.success("登录成功！");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "登录失败，请检查用户名和密码");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-green-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <ArrowLeftRight className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">欢迎回来</h1>
          <p className="text-gray-500 mt-2">登录您的闲置交换账户</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            还没有账户？{" "}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
