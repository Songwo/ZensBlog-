import { CommunityPostEditor } from "@/components/community/CommunityPostEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "发布帖子",
  description: "发布社区技术讨论帖",
};

export default function CommunityNewPostPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 py-12 fade-in-up">
      <h1 className="text-3xl font-bold text-[#111111] mb-6">发布社区帖子</h1>
      <CommunityPostEditor />
    </div>
  );
}

