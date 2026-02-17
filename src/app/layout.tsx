import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "Zen's Blog",
    template: "%s | Zen's Blog",
  },
  description: "一个关于技术、设计与生活的个人博客",
};

const themeScript = `
  (function() {
    var saved = null;
    try {
      saved = localStorage.getItem('theme');
    } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved === 'night' || saved === 'zenlab' ? saved : (prefersDark ? 'night' : 'zenlab');
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'night' ? 'dark' : 'light';
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
