import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { commentsApi } from "../api";
import type { Comment } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { MessageSquare, Reply, Trash2, User, Send, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE } from "../api/client";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) {
      const mins = Math.floor(diff / 60000);
      return mins <= 0 ? "刚刚" : `${mins}分钟前`;
    }
    return `${hours}小时前`;
  }
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

function Avatar({ user }: { user: { id: number; username: string; avatar: string } }) {
  return (
    <Link to={`/user/${user.id}`} className="flex-shrink-0">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary-300 transition-all">
        {user.avatar ? (
          <img src={`${API_BASE}${user.avatar}`} alt={user.username} className="w-full h-full object-cover" />
        ) : (
          <User size={14} className="text-primary-500" />
        )}
      </div>
    </Link>
  );
}

interface ReplyBoxProps {
  placeholder: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

function ReplyBox({ placeholder, onSubmit, onCancel, autoFocus }: ReplyBoxProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
        }}
        placeholder={placeholder}
        rows={2}
        maxLength={500}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
      />
      <div className="flex flex-col gap-1.5">
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="flex items-center gap-1 text-xs bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <Send size={12} />
          {submitting ? "发送中" : "发送"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  itemOwnerId: number;
  onReplySubmit: (content: string, parentId: number, replyToId: number) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
  isNested?: boolean;
}

function CommentItem({ comment, itemOwnerId, onReplySubmit, onDelete, isNested }: CommentItemProps) {
  const user = useAuthStore((s) => s.user);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const canDelete = user && (user.id === comment.author_id || user.id === itemOwnerId);

  return (
    <div className={`${isNested ? "ml-10 mt-2" : ""}`}>
      <div className="flex gap-2.5">
        <Avatar user={comment.author} />
        <div className="flex-1 min-w-0">
          {/* 评论气泡 */}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 relative group">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Link
                to={`/user/${comment.author.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {comment.author.username}
              </Link>
              {comment.author.id === itemOwnerId && (
                <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                  楼主
                </span>
              )}
              {comment.reply_to && (
                <span className="text-xs text-gray-400">
                  回复{" "}
                  <Link
                    to={`/user/${comment.reply_to.id}`}
                    className="text-primary-600 hover:underline font-medium"
                  >
                    @{comment.reply_to.username}
                  </Link>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            {/* 删除按钮（悬停显示） */}
            {canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                title="删除评论"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {/* 操作行 */}
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
            {user && (
              <button
                onClick={() => setShowReplyBox((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors"
              >
                <Reply size={12} />
                回复
              </button>
            )}
            {!isNested && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies((v) => !v)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showReplies ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showReplies ? "收起" : `展开`} {comment.replies.length} 条回复
              </button>
            )}
          </div>

          {/* 回复输入框 */}
          {showReplyBox && user && (
            <div className="mt-2 ml-1">
              <ReplyBox
                placeholder={`回复 @${comment.author.username}...（Ctrl+Enter 发送）`}
                autoFocus
                onSubmit={async (content) => {
                  await onReplySubmit(content, comment.parent_id ?? comment.id, comment.author_id);
                  setShowReplyBox(false);
                }}
                onCancel={() => setShowReplyBox(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 嵌套回复 */}
      {!isNested && showReplies && comment.replies.length > 0 && (
        <div className="space-y-2 mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              itemOwnerId={itemOwnerId}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              isNested
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentSectionProps {
  itemId: number;
  itemOwnerId: number;
}

export default function CommentSection({ itemId, itemOwnerId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  const fetchComments = async () => {
    try {
      const res = await commentsApi.list(itemId);
      setComments(res.data);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [itemId]);

  const handleRootSubmit = async (content: string) => {
    try {
      await commentsApi.create(itemId, { content });
      await fetchComments();
      toast.success("留言成功");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "发送失败");
      throw err;
    }
  };

  const handleReplySubmit = async (content: string, parentId: number, replyToId: number) => {
    try {
      await commentsApi.create(itemId, { content, parent_id: parentId, reply_to_id: replyToId });
      await fetchComments();
      toast.success("回复成功");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "发送失败");
      throw err;
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("确定删除此评论吗？")) return;
    try {
      await commentsApi.remove(commentId);
      await fetchComments();
      toast.success("评论已删除");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "删除失败");
    }
  };

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  return (
    <div className="mt-8">
      {/* 标题 */}
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare size={20} />
        留言区
        {totalCount > 0 && (
          <span className="text-sm font-normal text-gray-400">（{totalCount} 条）</span>
        )}
      </h2>

      {/* 发表留言 */}
      {user ? (
        <div className="flex gap-3 mb-6">
          <Avatar user={user} />
          <div className="flex-1">
            <ReplyBox
              placeholder="说点什么吧...（Ctrl+Enter 发送）"
              onSubmit={handleRootSubmit}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6 p-3 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
          <Link to="/login" className="text-primary-600 hover:underline font-medium">登录</Link>
          {" "}后即可参与留言
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-16 bg-gray-100 rounded-xl" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">暂无留言，来抢沙发吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              itemOwnerId={itemOwnerId}
              onReplySubmit={handleReplySubmit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
