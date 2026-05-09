import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export function AdminLayout({
  pathname,
  title,
  email,
  children,
}: {
  pathname: string;
  title: string;
  email?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbf6,#ffffff)]">
      <div className="flex min-h-screen">
        <AdminSidebar pathname={pathname} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar title={title} email={email} />
          <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
