"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/utils";
import { signIn, useSession } from "next-auth/react";
import { AuthorMini } from "@/components/blog/AuthorMini";
import { markdownToHtml } from "@/lib/client-markdown";
import { EMOJI_PICKER_ITEMS } from "@/lib/emoji";
import { LinkCardEnhancer } from "@/components/blog/LinkCardEnhancer";

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  userId: string | null;
  likeCount?: number;
  viewerLiked?: boolean;
  user?: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    title: string | null;
    activeBadge: { id: string; name: string; icon: string; iconUrl: string | null; color: string } | null;
  } | null;
  replies?: Comment[];
}

export function CommentSection({
  postId,
  comments: initialComments,
}: {
  postId: string;
  comments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);

  async function reloadComments() {
    try {
      const res = await fetch(`/api/comments?postId=${encodeURIComponent(postId)}`, { cache: "no-store" });
      const data = await res.json() as { comments?: Comment[] };
      if (res.ok && Array.isArray(data.comments)) {
        setComments(data.comments);
      }
    } catch {
      // ignore network error
    }
  }

  useEffect(() => {
    void reloadComments();
  }, [postId]);

  return (
    <div>
      <h3 className="font-heading text-xl font-bold mb-6 text-[#1b1b1b]">
        评论 ({comments.length})
      </h3>
      <CommentForm postId={postId} onPublished={reloadComments} />
      <div className="mt-8 space-y-6">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} onChanged={reloadComments} />
        ))}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  onChanged,
}: {
  comment: Comment;
  postId: string;
  onChanged: () => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [liked, setLiked] = useState(Boolean(comment.viewerLiked));
  const [likeCount, setLikeCount] = useState(Number(comment.likeCount || 0));
  const [likeLoading, setLikeLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const html = useMemo(() => markdownToHtml(comment.content || ""), [comment.content]);
  const containerId = `comment-${comment.id}`;

  async function toggleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    const nextLiked = !liked;
    const nextCount = Math.max(0, likeCount + (nextLiked ? 1 : -1));
    setLiked(nextLiked);
    setLikeCount(nextCount);
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
      const data = await res.json() as { liked?: boolean; count?: number };
      if (!res.ok) throw new Error("request_failed");
      setLiked(Boolean(data.liked));
      setLikeCount(Number(data.count || 0));
    } catch {
      setLiked(!nextLiked);
      setLikeCount(likeCount);
    } finally {
      setLikeLoading(false);
    }
  }

  async function reportComment(reason: string) {
    if (reporting) return;
    setReporting(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "COMMENT",
          targetId: comment.id,
          reason,
          detail: "",
        }),
      });
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="border-l-2 border-[#e5e7eb] pl-4">
      <div className="flex items-center gap-2 mb-1">
        <AuthorMini
          name={comment.user?.name || comment.author}
          username={comment.user?.username || null}
          image={comment.user?.image || null}
          title={comment.user?.title || null}
          badge={comment.user?.activeBadge || null}
          enablePreview
        />
        {comment.userId && <span className="text-xs text-[#7b8192]">(作者)</span>}
        <time className="text-xs text-[#7b8192]">{formatDate(comment.createdAt)}</time>
      </div>
      <div
        id={containerId}
        className="text-sm text-[#4f5668] mb-2 prose prose-sm max-w-none comment-rich-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <LinkCardEnhancer containerId={containerId} />
      <button
        onClick={() => setShowReply(!showReply)}
        className="text-xs text-[#7b8192] hover:text-[#c73b78] transition-colors"
      >
        回复
      </button>
      <button
        onClick={() => void toggleLike()}
        disabled={likeLoading}
        className={`ml-3 text-xs transition-colors ${liked ? "text-[#c73b78]" : "text-[#7b8192] hover:text-[#c73b78]"}`}
      >
        赞 {likeCount}
      </button>
      <button
        onClick={() => void reportComment("SPAM")}
        disabled={reporting}
        className="ml-3 text-xs text-[#7b8192] hover:text-[#c73b78] transition-colors"
      >
        举报
      </button>
      {showReply && (
        <div className="mt-3">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onSuccess={() => setShowReply(false)}
            onPublished={onChanged}
          />
        </div>
      )}
      {(comment.replies?.length ?? 0) > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies!.map((reply) => (
            <div key={reply.id} className="border-l-2 border-[#eceef2] pl-4">
              <div className="flex items-center gap-2 mb-1">
                <AuthorMini
                  name={reply.user?.name || reply.author}
                  username={reply.user?.username || null}
                  image={reply.user?.image || null}
                  title={reply.user?.title || null}
                  badge={reply.user?.activeBadge || null}
                  enablePreview
                />
                {reply.userId && <span className="text-xs text-[#7b8192]">(作者)</span>}
                <time className="text-xs text-[#7b8192]">{formatDate(reply.createdAt)}</time>
              </div>
              <div
                id={`comment-${reply.id}`}
                className="text-sm text-[#4f5668] prose prose-sm max-w-none comment-rich-content"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(reply.content || "") }}
              />
              <LinkCardEnhancer containerId={`comment-${reply.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  onSuccess,
  onPublished,
}: {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onPublished?: () => Promise<void>;
}) {
  const { data: session } = useSession();
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewId = useMemo(
    () => `comment-preview-${parentId || "new"}-${postId}`,
    [parentId, postId],
  );
  const previewHtml = useMemo(() => markdownToHtml(content || ""), [content]);

  function insertText(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => `${prev}${text}`);
      return;
    }
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || start;
    const next = `${content.slice(0, start)}${text}${content.slice(end)}`;
    setContent(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user || !content.trim()) return;

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId, content }),
      });

      if (res.ok) {
        setMessage("评论已提交，等待审核后显示。");
        setContent("");
        onSuccess?.();
        await onPublished?.();
      } else {
        setMessage("提交失败，请稍后重试。");
      }
    } catch {
      setMessage("网络错误，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!session?.user && (
        <div className="rounded-md border border-[#e2e8f0] bg-white/70 p-3 text-sm text-[#64748b]">
          评论需先登录。
          <button type="button" onClick={() => signIn("github")} className="ml-2 text-[#c73b78] hover:underline">使用 GitHub 登录</button>
        </div>
      )}
      {!parentId && (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="昵称 *"
            disabled
            className="px-3 py-2 rounded-md text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱（可选）"
            disabled
            className="px-3 py-2 rounded-md text-sm"
          />
        </div>
      )}
      {parentId && !author && (
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="昵称 *"
          disabled
          className="w-full px-3 py-2 rounded-md text-sm"
        />
      )}
      <div className="flex items-center gap-3 text-xs text-[#7b8192]">
        <button type="button" onClick={() => setMode("write")} className={mode === "write" ? "text-[#c73b78]" : ""}>编辑</button>
        <button type="button" onClick={() => setMode("preview")} className={mode === "preview" ? "text-[#c73b78]" : ""}>预览</button>
        <button type="button" onClick={() => insertText(" @")} className="hover:text-[#c73b78]">@用户</button>
        <button type="button" onClick={() => setEmojiOpen((v) => !v)} className="hover:text-[#c73b78]">表情</button>
        {emojiOpen && (
          <div className="rounded-md border border-[#e2e8f0] bg-white p-2 shadow-sm flex flex-wrap gap-1.5 max-w-[420px]">
            {EMOJI_PICKER_ITEMS.map((item) => (
              <button
                key={item.shortcode}
                type="button"
                className="px-2 py-1 text-xs rounded border border-[#e2e8f0] hover:border-[#c73b78] hover:text-[#c73b78]"
                onClick={() => {
                  insertText(` :${item.shortcode}: `);
                  setEmojiOpen(false);
                }}
              >
                {item.unicode || `:${item.shortcode}:`}
              </button>
            ))}
          </div>
        )}
      </div>
      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论... 支持 Markdown（如 **加粗**、`code`）"
          required
          disabled={!session?.user}
          rows={parentId ? 2 : 4}
          className="w-full px-3 py-2 rounded-md text-sm resize-none"
        />
      ) : (
        <>
          <div
            id={previewId}
            className="w-full min-h-24 px-3 py-2 rounded-md text-sm prose prose-sm max-w-none bg-white/70 comment-rich-content"
            dangerouslySetInnerHTML={{ __html: previewHtml || "<p>暂无内容</p>" }}
          />
          <LinkCardEnhancer containerId={previewId} />
        </>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting || !session?.user}
          className="cyber-cta"
        >
          {submitting ? "提交中..." : "提交评论"}
        </button>
        {message && <span className="text-xs text-[#7b8192]">{message}</span>}
      </div>
    </form>
  );
}
