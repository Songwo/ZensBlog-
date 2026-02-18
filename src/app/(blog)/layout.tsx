import { Header } from "@/components/blog/Header";
import { Footer } from "@/components/blog/Footer";
import { GlobalHotkeys } from "@/components/blog/GlobalHotkeys";
import { SpotlightSearch } from "@/components/blog/SpotlightSearch";
import { getSiteSettings } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="zen-lab-shell">
      <Header siteName={settings.siteName} />
      <main className="w-full min-h-screen relative z-10">{children}</main>
      <GlobalHotkeys />
      <SpotlightSearch />
      <Footer siteName={settings.siteName} />
    </div>
  );
}
