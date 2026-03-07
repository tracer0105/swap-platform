import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useState, useEffect } from "react";
import { chatApi } from "../api";
import {
  Package,
  MessageCircle,
  User,
  LogOut,
  PlusCircle,
  ArrowLeftRight,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      chatApi.getUnreadCount().then((res) => setUnreadCount(res.data.unread_count));
    }
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "浏览物品", icon: <Package size={18} /> },
    ...(user
      ? [
          { to: "/publish", label: "发布物品", icon: <PlusCircle size={18} /> },
          { to: "/exchanges", label: "交换申请", icon: <ArrowLeftRight size={18} /> },
          { to: "/chat", label: "消息", icon: <MessageCircle size={18} />, badge: unreadCount },
          { to: "/profile", label: "我的", icon: <User size={18} /> },
        ]
      : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <ArrowLeftRight size={24} />
            <span>闲置交换</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  location.pathname === link.to
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.icon}
                {link.label}
                {link.badge ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                ) : null}
              </Link>
            ))}

            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors ml-2"
              >
                <LogOut size={18} />
                退出
              </button>
            ) : (
              <div className="flex gap-2 ml-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5">
                  登录
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.icon}
                {link.label}
                {link.badge ? (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-auto">
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full"
              >
                <LogOut size={18} />
                退出登录
              </button>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm flex-1 text-center">
                  登录
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm flex-1 text-center">
                  注册
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
