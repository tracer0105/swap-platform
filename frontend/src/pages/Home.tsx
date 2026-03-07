import { useState, useEffect } from "react";
import { itemsApi } from "../api";
import type { Item } from "../types";
import ItemCard from "../components/ItemCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = ["全部", "电子产品", "书籍", "服装", "家居", "运动", "玩具", "乐器", "工具", "其他"];
const CONDITIONS = [
  { value: "", label: "全部成色" },
  { value: "new", label: "全新" },
  { value: "like_new", label: "几乎全新" },
  { value: "good", label: "良好" },
  { value: "fair", label: "一般" },
  { value: "poor", label: "较差" },
];

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const pageSize = 12;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await itemsApi.list({
        page,
        page_size: pageSize,
        keyword: keyword || undefined,
        category: category || undefined,
        condition: condition || undefined,
        status: "available",
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, keyword, category, condition]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setKeyword("");
    setSearchInput("");
    setCategory("");
    setCondition("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);
  const hasFilters = keyword || category || condition;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 搜索栏 */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-10"
              placeholder="搜索物品名称或描述..."
            />
          </div>
          <button type="submit" className="btn-primary px-6">
            搜索
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary px-4 flex items-center gap-2 ${showFilters ? "bg-gray-100" : ""}`}
          >
            <SlidersHorizontal size={16} />
            筛选
          </button>
        </form>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">成色</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setCondition(c.value); setPage(1); }}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        condition === c.value
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分类标签 */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat === "全部" ? "" : cat); setPage(1); }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (cat === "全部" && !category) || category === cat
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-primary-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 结果信息 */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? "加载中..." : `共 ${total} 件物品`}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <X size={14} />
              清除筛选
            </button>
          )}
        </p>
      </div>

      {/* 物品网格 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">暂无物品</p>
          <p className="text-sm mt-1">试试调整搜索条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            上一页
          </button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}

function Package({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
