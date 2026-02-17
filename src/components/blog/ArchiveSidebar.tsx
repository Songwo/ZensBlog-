import Link from "next/link";

interface ArchiveSidebarProps {
  archives: Array<{
    year: number;
    month: number;
    count: number;
  }>;
}

export function ArchiveSidebar({ archives }: ArchiveSidebarProps) {
  if (archives.length === 0) return null;

  // 按年份分组
  const groupedByYear = archives.reduce((acc, item) => {
    if (!acc[item.year]) {
      acc[item.year] = [];
    }
    acc[item.year].push(item);
    return acc;
  }, {} as Record<number, typeof archives>);

  const years = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const monthNames = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];

  return (
    <div className="zen-glass-card rounded-xl border border-[#eceff5] bg-white/60 backdrop-blur-md p-6 shadow-[0_8px_24px_rgba(17,24,39,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
      <h3 className="text-lg font-semibold text-[#111111] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#f05d9a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        归档
      </h3>
      <div className="space-y-4">
        {years.map((year) => {
          const yearTotal = groupedByYear[year].reduce((sum, item) => sum + item.count, 0);
          return (
            <div key={year}>
              <Link
                href={`/archives?year=${year}`}
                className="flex items-center justify-between text-[#111111] font-medium mb-2 hover:text-[#f05d9a] transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#f05d9a] opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {year} 年
                </span>
                <span className="text-sm text-[#64748b]">{yearTotal} 篇</span>
              </Link>
              <div className="ml-4 space-y-1">
                {groupedByYear[year]
                  .sort((a, b) => b.month - a.month)
                  .map((item) => (
                    <Link
                      key={`${item.year}-${item.month}`}
                      href={`/archives?year=${item.year}&month=${item.month}`}
                      className="flex items-center justify-between text-sm text-[#64748b] hover:text-[#f05d9a] transition-colors py-1"
                    >
                      <span>{monthNames[item.month - 1]}</span>
                      <span className="text-xs">({item.count})</span>
                    </Link>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
