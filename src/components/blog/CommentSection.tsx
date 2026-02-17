"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { signIn, useSession } from "next-auth/react";
import { AuthorMini } from "@/components/blog/AuthorMini";

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  userId: string | null;
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
  comments,
}: {
  postId: string;
  comments: Comment[];
}) {
  return (
    <div>
      <h3 className="font-heading text-xl font-bold mb-6 text-[#1b1b1b]">
        评论 ({comments.length})
      </h3>
      <CommentForm postId={postId} />
      <div className="mt-8 space-y-6">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>
    </div>
  );
}

function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const [showReply, setShowReply] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  return (
    <div className="border-l-2 border-[#e5e7eb] pl-4">
      <div className="flex items-center gap-2 mb-1">
        <AuthorMini
          name={comment.user?.name || comment.author}
          username={comment.user?.username || null}
          image={comment.user?.image || null}
          title={comment.user?.title || null}
          badge={comment.user?.activeBadge || null}
        />
        {comment.userId && <span className="text-xs text-[#7b8192]">(作者)</span>}
        <time className="text-xs text-[#7b8192]">{formatDate(comment.createdAt)}</time>
      </div>
      <p className="text-sm text-[#4f5668] mb-2">{comment.content}</p>
      <button
        onClick={() => setShowReply(!showReply)}
        className="text-xs text-[#7b8192] hover:text-[#c73b78] transition-colors"
      >
        回复
      </button>
      <button
        onClick={() => {
          setLiked((v) => !v);
          setLikeCount((v) => v + (liked ? -1 : 1));
        }}
        className={`ml-3 text-xs transition-colors ${liked ? "text-[#c73b78]" : "text-[#7b8192] hover:text-[#c73b78]"}`}
      >
        赞 {likeCount}
      </button>
      {showReply && (
        <div className="mt-3">
          <CommentForm postId={postId} parentId={comment.id} onSuccess={() => setShowReply(false)} />
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
                />
                {reply.userId && <span className="text-xs text-[#7b8192]">(作者)</span>}
                <time className="text-xs text-[#7b8192]">{formatDate(reply.createdAt)}</time>
              </div>
              <p className="text-sm text-[#4f5668]">{reply.content}</p>
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
}: {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
}) {
  const { data: session } = useSession();
  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function insertText(text: string) {
    setContent((prev) => `${prev}${text}`);
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
        <button type="button" onClick={() => insertText(" :smile:")} className="hover:text-[#c73b78]">:smile:</button>
        <button type="button" onClick={() => insertText(" :rocket:")} className="hover:text-[#c73b78]">:rocket:</button>
      </div>
      {mode === "write" ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论... 支持 Markdown（如 **加粗**、`code`）"
          required
          disabled={!session?.user}
          rows={parentId ? 2 : 4}
          className="w-full px-3 py-2 rounded-md text-sm resize-none"
        />
      ) : (
        <div className="w-full min-h-24 px-3 py-2 rounded-md text-sm whitespace-pre-wrap">
          {content || "暂无内容"}
        </div>
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
