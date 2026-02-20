import { Sidebar } from "@/components/admin/Sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc_0%,#f1f5f9_45%,#e2e8f0_100%)] dark:bg-none">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="rounded-xl border border-border/60 bg-bg/85 p-4 shadow-sm backdrop-blur-sm">{children}</div>
      </main>
    </div>
  );
}
