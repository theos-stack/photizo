import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { SettingsForm } from "@/components/forms/SettingsForm";
import { requireAdmin } from "@/lib/server/auth";
import { getSiteSettings } from "@/lib/data";

export default async function SettingsPage() {
  const user = await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <AdminLayout pathname="/admin/settings" title="Admin Settings" email={user.email}>
      <Container className="space-y-6 px-0">
        <SettingsForm settings={settings} />
      </Container>
    </AdminLayout>
  );
}
