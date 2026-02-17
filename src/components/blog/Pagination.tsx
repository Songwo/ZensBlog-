import Link from "next/link";
import { getPageRange } from "@/lib/utils";

interface PaginationProps {
  current: number;
  total: number;
  basePath: string;
}

export function Pagination({ current, total, basePath }: PaginationProps) {
  if (total <= 1) return null;

  const pages = getPageRange(current, total);
  const sep = basePath.includes("?") ? "&" : "?";

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="分页">
      {current > 1 && (
        <Link
          href={`${basePath}${sep}page=${current - 1}`}
          className="pagination-cyber"
        >
          上一页
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={`${basePath}${sep}page=${p}`}
          className={`pagination-cyber ${p === current ? "pagination-cyber-active" : ""}`}
        >
          {p}
        </Link>
      ))}
      {current < total && (
        <Link
          href={`${basePath}${sep}page=${current + 1}`}
          className="pagination-cyber"
        >
          下一页
        </Link>
      )}
    </nav>
  );
}
