import Link from "next/link";

export function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="zen-footer">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12 py-8 text-center text-sm text-[#64748b]">
        <p>
          &copy; {new Date().getFullYear()} {siteName}。
        </p>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <Link href="/search" className="hover:text-[#c73b78] transition-colors">搜索</Link>
          <Link href="/lab" className="hover:text-[#c73b78] transition-colors">LAB</Link>
          <Link href="/uses" className="hover:text-[#c73b78] transition-colors">Uses</Link>
          <Link href="/changelog" className="hover:text-[#c73b78] transition-colors">Changelog</Link>
          <Link href="/archives" className="hover:text-[#c73b78] transition-colors">归档</Link>
          <a href="/api/feed.xml" className="hover:text-[#c73b78] transition-colors">RSS 订阅</a>
        </div>
      </div>
    </footer>
  );
}
