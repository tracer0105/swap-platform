import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { itemsApi } from "../api";
import toast from "react-hot-toast";
import { Upload, X, Image } from "lucide-react";
import { API_BASE } from "../api/client";

const CATEGORIES = ["电子产品", "书籍", "服装", "家居", "运动", "玩具", "乐器", "工具", "其他"];
const CONDITIONS = [
  { value: "new", label: "全新" },
  { value: "like_new", label: "几乎全新" },
  { value: "good", label: "良好" },
  { value: "fair", label: "一般" },
  { value: "poor", label: "较差" },
];

export default function PublishItem() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "其他",
    condition: "good",
    expected_exchange: "",
    location: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [itemId, setItemId] = useState<number | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      itemsApi.get(Number(id)).then((res) => {
        const item = res.data;
        setForm({
          title: item.title,
          description: item.description,
          category: item.category,
          condition: item.condition,
          expected_exchange: item.expected_exchange,
          location: item.location,
        });
        try {
          setImages(JSON.parse(item.images));
        } catch {}
        setItemId(item.id);
      });
    }
  }, [id, isEdit]);

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    setNewFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("请填写物品名称");
      return;
    }
    setSubmitting(true);
    try {
      let currentItemId = itemId;

      if (isEdit && currentItemId) {
        await itemsApi.update(currentItemId, form);
      } else {
        const res = await itemsApi.create(form);
        currentItemId = res.data.id;
        setItemId(currentItemId);
      }

      // 上传新图片
      if (newFiles.length > 0 && currentItemId) {
        await itemsApi.uploadImages(currentItemId, newFiles);
      }

      toast.success(isEdit ? "物品已更新！" : "物品发布成功！");
      navigate(`/items/${currentItemId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? "编辑物品" : "发布闲置物品"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 图片上传 */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Image size={18} /> 物品图片
          </h2>
          <div className="flex flex-wrap gap-3">
            {/* 已有图片 */}
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={`${API_BASE}${img}`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {/* 新预览图片 */}
            {previews.map((prev, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <img src={prev} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* 上传按钮 */}
            {images.length + previews.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
              >
                <Upload size={20} />
                <span className="text-xs mt-1">上传图片</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-xs text-gray-400 mt-2">最多上传6张图片，支持 JPG、PNG、WebP</p>
        </div>

        {/* 基本信息 */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-gray-800">基本信息</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品名称 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="input-field"
              placeholder="简洁描述物品，如：九成新 iPhone 12"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">物品描述</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="详细描述物品的状态、品牌、型号等信息..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="input-field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">成色</label>
              <select
                value={form.condition}
                onChange={(e) => update("condition", e.target.value)}
                className="input-field"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="input-field"
              placeholder="如：北京市朝阳区"
            />
          </div>
        </div>

        {/* 交换意向 */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">交换意向</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期望换取</label>
            <textarea
              value={form.expected_exchange}
              onChange={(e) => update("expected_exchange", e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="描述您希望换取的物品，如：书籍、电子产品等"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            取消
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "提交中..." : isEdit ? "保存修改" : "发布物品"}
          </button>
        </div>
      </form>
    </div>
  );
}
