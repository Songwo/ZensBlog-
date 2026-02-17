import Link from "next/link";

interface TagCloudProps {
  tags: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
}

export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) return null;

  // 计算标签大小（基于文章数量）
  const maxCount = Math.max(...tags.map((t) => t.count));
  const minCount = Math.min(...tags.map((t) => t.count));
  const range = maxCount - minCount || 1;

  const getTagSize = (count: number) => {
    const normalized = (count - minCount) / range;
    const minSize = 0.75;
    const maxSize = 1.5;
    return minSize + normalized * (maxSize - minSize);
  };

  return (
    <div className="zen-glass-card rounded-xl border border-[#eceff5] bg-white/60 backdrop-blur-md p-6 shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
      <h3 className="text-lg font-semibold text-[#111111] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#f05d9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        标签云
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const size = getTagSize(tag.count);
          return (
            <Link
              key={tag.id}
              href={`/tag/${tag.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-[#e5e7ef] bg-white/60 backdrop-blur-sm px-3 py-1 text-[#475569] transition-all duration-300 hover:border-[#f2a3c4] hover:text-[#c73b78] hover:bg-gradient-to-r hover:from-[#fff0f6] hover:to-[#ffe8f0] hover:shadow-[0_4px_12px_rgba(240,93,154,0.2)] hover:scale-105"
              style={{ fontSize: `${size * 0.875}rem` }}
            >
              #{tag.name}
              <span className="text-xs opacity-60">({tag.count})</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
