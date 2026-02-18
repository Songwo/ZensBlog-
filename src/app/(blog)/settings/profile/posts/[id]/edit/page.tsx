"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProfilePostComposer } from "@/components/profile/ProfilePostComposer";

type PostPayload = {
  post: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
    coverImage?: string;
    categoryId?: string | null;
    tags?: Array<{ tagId: string }>;
  };
};

export default function ProfilePostEditPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [initial, setInitial] = useState<{
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
    coverImage?: string;
    categoryId?: string | null;
    tagIds?: string[];
  } | null>(null);

  useEffect(() => {
    const postId = params?.id;
    if (!postId) return;
    (async () => {
      const res = await fetch(`/api/profile/posts/${postId}`, { cache: "no-store" });
      const data = (await res.json()) as PostPayload | { error?: string };
      if (!res.ok || !("post" in data)) {
        setMessage(("error" in data && data.error) || "加载文章失败");
        setLoading(false);
        return;
      }
      setInitial({
        title: data.post.title || "",
        excerpt: data.post.excerpt || "",
        content: data.post.content || "",
        published: Boolean(data.post.published),
        coverImage: data.post.coverImage || "",
        categoryId: data.post.categoryId || "",
        tagIds: Array.isArray(data.post.tags) ? data.post.tags.map((item) => item.tagId) : [],
      });
      setLoading(false);
    })();
  }, [params?.id]);

  if (loading) {
    return <div className="mx-auto max-w-[1440px] px-4 py-12 text-sm text-slate-500">加载中...</div>;
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900">编辑我的文章</h1>
      <p className="text-sm text-slate-500 mt-2">支持修改标题、摘要、正文和发布状态。</p>
      {initial ? <div className="mt-6"><ProfilePostComposer mode="edit" postId={params.id} initial={initial} /></div> : null}
      {message && <p className="mt-3 text-xs text-rose-600">{message}</p>}
    </div>
  );
}
