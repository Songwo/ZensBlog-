"use client";

import { ProfilePostComposer } from "@/components/profile/ProfilePostComposer";

export default function ProfilePostCreatePage() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-slate-900">发布文章</h1>
      <p className="text-sm text-slate-500 mt-2">普通用户可直接发布，不需要管理员审核。</p>
      <div className="mt-6">
        <ProfilePostComposer mode="create" />
      </div>
    </div>
  );
}
