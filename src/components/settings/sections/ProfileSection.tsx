"use client";

import { useEffect, useMemo, useState } from "react";
import type { MeOverview } from "@/components/settings/types";

type Props = {
  data: MeOverview;
  onUpdated: () => Promise<unknown>;
  notifyDirty: (dirty: boolean) => void;
  toast: (type: "success" | "error", message: string) => void;
};

async function resizeAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法处理图片");

  const size = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, 256, 256);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("图片压缩失败"));
      resolve(blob);
    }, "image/webp", 0.85);
  });
}

export default function ProfileSection({ data, onUpdated, notifyDirty, toast }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    name: data.profile.name || "",
    username: data.profile.username || "",
    bio: data.profile.bio || "",
    website: data.profile.website || "",
    twitter: data.profile.twitter || "",
    linkedin: data.profile.linkedin || "",
    activeBadgeId: data.profile.activeBadgeId || "",
    showEmail: data.settings.privacy.showEmail,
    showSocialLinks: data.settings.privacy.showSocialLinks,
    cardBackgroundStyle: data.settings.card.backgroundStyle,
    cardHeadline: data.settings.card.headline || "",
    cardShowBio: data.settings.card.showBio,
    cardShowStats: data.settings.card.showStats,
    cardShowSocial: data.settings.card.showSocial,
    cardShowLevel: data.settings.card.showLevel,
    cardShowBadge: data.settings.card.showBadge,
  });

  const previewInitial = data.profile.image || "";
  const [preview, setPreview] = useState(previewInitial);
  const changed = useMemo(() => JSON.stringify(form) !== JSON.stringify({
    name: data.profile.name || "",
    username: data.profile.username || "",
    bio: data.profile.bio || "",
    website: data.profile.website || "",
    twitter: data.profile.twitter || "",
    linkedin: data.profile.linkedin || "",
    activeBadgeId: data.profile.activeBadgeId || "",
    showEmail: data.settings.privacy.showEmail,
    showSocialLinks: data.settings.privacy.showSocialLinks,
    cardBackgroundStyle: data.settings.card.backgroundStyle,
    cardHeadline: data.settings.card.headline || "",
    cardShowBio: data.settings.card.showBio,
    cardShowStats: data.settings.card.showStats,
    cardShowSocial: data.settings.card.showSocial,
    cardShowLevel: data.settings.card.showLevel,
    cardShowBadge: data.settings.card.showBadge,
  }), [form, data]);

  useEffect(() => {
    notifyDirty(changed);
  }, [changed, notifyDirty]);

  async function onAvatarFile(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast("error", "头像仅支持 png/jpg/webp");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("error", "图片不能超过 2MB");
      return;
    }

    setUploading(true);
    try {
      const blob = await resizeAvatar(file);
      if (blob.size > 2 * 1024 * 1024) {
        toast("error", "压缩后图片仍超过 2MB");
        return;
      }

      const localUrl = URL.createObjectURL(blob);
      setPreview(localUrl);

      const formData = new FormData();
      formData.append("file", new File([blob], "avatar.webp", { type: "image/webp" }));
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const payload = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        toast("error", payload.error || "头像上传失败");
        return;
      }
      setPreview(payload.url || localUrl);
      toast("success", "头像已更新");
      await onUpdated();
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast("error", payload.error || "保存失败");
        return;
      }
      notifyDirty(false);
      toast("success", "资料保存成功");
      await onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#eceff5] bg-white/80 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">头像与资料</h3>
        <p className="mt-1 text-xs text-slate-500">支持拖拽上传，自动裁剪压缩到 256x256（2MB 内）。</p>

        <div className="mt-4 grid gap-5 md:grid-cols-[220px_1fr]">
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void onAvatarFile(file);
              }}
              className={`grid h-52 place-items-center rounded-xl border-2 border-dashed ${
                dragging ? "border-accent bg-rose-50" : "border-slate-300 bg-slate-50"
              }`}
            >
              {preview ? (
                <img src={preview} alt="avatar" className="h-40 w-40 rounded-full border border-slate-200 object-cover" />
              ) : (
                <span className="text-xs text-slate-500">拖拽头像到这里</span>
              )}
            </div>
            <label className="mt-3 inline-flex cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              {uploading ? "上传中..." : "选择图片"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onAvatarFile(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                阅读时长：<span className="font-semibold text-slate-900">{data.stats.readingMinutes} 分钟</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                等级：<span className="font-semibold text-slate-900">{data.level.levelName}</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                连续阅读天数：<span className="font-semibold text-slate-900">{data.level.daysRead} 天</span>
              </div>
            </div>

            <input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} placeholder="昵称" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <input value={form.username} onChange={(e) => setForm((v) => ({ ...v, username: e.target.value }))} placeholder="用户名（2-30 位，字母数字_-）" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <textarea value={form.bio} onChange={(e) => setForm((v) => ({ ...v, bio: e.target.value }))} rows={4} placeholder="简介" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={form.website} onChange={(e) => setForm((v) => ({ ...v, website: e.target.value }))} placeholder="个人网站" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={form.twitter} onChange={(e) => setForm((v) => ({ ...v, twitter: e.target.value }))} placeholder="Twitter/X" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            </div>
            <input value={form.linkedin} onChange={(e) => setForm((v) => ({ ...v, linkedin: e.target.value }))} placeholder="LinkedIn" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">佩戴徽章</p>
              <div className="flex flex-wrap gap-2">
                {data.badges.length === 0 && <span className="text-xs text-slate-500">暂无可用徽章</span>}
                {data.badges.map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => setForm((v) => ({ ...v, activeBadgeId: badge.id }))}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      form.activeBadgeId === badge.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {badge.icon} {badge.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.showEmail} onChange={(e) => setForm((v) => ({ ...v, showEmail: e.target.checked }))} />
                公开邮箱
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.showSocialLinks} onChange={(e) => setForm((v) => ({ ...v, showSocialLinks: e.target.checked }))} />
                公开社交链接
              </label>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">个人快速预览卡片</p>
              <p className="mt-1 text-xs text-slate-500">用于评论区和头像点击时展示的小卡片内容。</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-slate-600">
                  背景样式
                  <select
                    value={form.cardBackgroundStyle}
                    onChange={(e) => setForm((v) => ({ ...v, cardBackgroundStyle: e.target.value as "pink-glass" | "ocean" | "sunset" | "night-grid" }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="pink-glass">粉色玻璃</option>
                    <option value="ocean">海蓝</option>
                    <option value="sunset">日落</option>
                    <option value="night-grid">夜色网格</option>
                  </select>
                </label>
                <label className="text-xs text-slate-600">
                  卡片标题
                  <input
                    value={form.cardHeadline}
                    onChange={(e) => setForm((v) => ({ ...v, cardHeadline: e.target.value }))}
                    placeholder="例如：欢迎交流前端与产品设计"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.cardShowBio} onChange={(e) => setForm((v) => ({ ...v, cardShowBio: e.target.checked }))} /> 显示简介</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.cardShowStats} onChange={(e) => setForm((v) => ({ ...v, cardShowStats: e.target.checked }))} /> 显示统计</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.cardShowSocial} onChange={(e) => setForm((v) => ({ ...v, cardShowSocial: e.target.checked }))} /> 显示社交链接</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.cardShowLevel} onChange={(e) => setForm((v) => ({ ...v, cardShowLevel: e.target.checked }))} /> 显示等级</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.cardShowBadge} onChange={(e) => setForm((v) => ({ ...v, cardShowBadge: e.target.checked }))} /> 显示徽章</label>
              </div>
            </div>
            <button onClick={save} disabled={saving} className="rounded-lg bg-accent px-4 py-2.5 text-sm text-white hover:opacity-90 disabled:opacity-50">
              {saving ? "保存中..." : "保存资料"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
