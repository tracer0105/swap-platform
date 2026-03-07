import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { ArrowLeftRight } from "lucide-react";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error("请填写所有必填项");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("两次密码不一致");
      return;
    }
    if (form.password.length < 6) {
      toast.error("密码长度不能少于6位");
      return;
    }
    try {
      await register(form.username, form.email, form.password);
      toast.success("注册成功！");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "注册失败，请重试");
    }
  };

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-green-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <ArrowLeftRight className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建账户</h1>
          <p className="text-gray-500 mt-2">加入闲置物品交换平台</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="input-field"
                placeholder="2-20个字符"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input-field"
                placeholder="至少6位"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认密码 *</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
                className="input-field"
                placeholder="再次输入密码"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base mt-2"
            >
              {isLoading ? "注册中..." : "注册"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            已有账户？{" "}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
