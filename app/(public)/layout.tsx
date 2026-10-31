import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase?.auth.getUser() ?? { data: { user: null } };

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Header memberEmail={user?.email ?? null} />
      <main className="flex-1">{children}</main>
      <Footer />
      <PwaInstallPrompt />
    </div>
  );
}
