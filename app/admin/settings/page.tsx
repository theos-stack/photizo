import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { SettingsForm } from "@/components/forms/SettingsForm";
import { requireAdmin } from "@/lib/server/auth";
import { getAdminUsers, getSiteSettings } from "@/lib/data";

type PageProps = {
  searchParams: Promise<{
    forbidden?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  const user = await requireAdmin();
  const params = await searchParams;
  const [settings, admins] = await Promise.all([
    getSiteSettings(),
    user.isSuperAdmin ? getAdminUsers() : Promise.resolve([]),
  ]);

  return (
    <AdminLayout pathname="/admin/settings" title="Admin Settings" email={user.email}>
      <Container className="space-y-6 px-0">
        <SettingsForm settings={settings} />
        {user.isSuperAdmin ? (
          <AdminUsersManager admins={admins} currentUserEmail={user.email || ""} />
        ) : (
          <div className="rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-6 text-sm leading-7 text-[rgba(11,11,11,0.68)] shadow-soft">
            <p className="font-medium text-[var(--black)]">Admin access is restricted.</p>
            <p className="mt-2">
              Ordinary admins can manage ministry content and operations, but only
              super admins can add, remove, or promote other admins.
            </p>
            {params.forbidden === "1" ? (
              <p className="mt-3 text-rose-600">
                Your account does not have super admin rights for access control.
              </p>
            ) : null}
          </div>
        )}
      </Container>
    </AdminLayout>
  );
}
