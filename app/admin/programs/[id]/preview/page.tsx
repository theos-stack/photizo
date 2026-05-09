import { notFound } from "next/navigation";

import { AdminLayout } from "@/components/AdminLayout";
import { ProgramDetailView } from "@/components/programs/ProgramDetailView";
import { requireAdmin } from "@/lib/server/auth";
import { getProgramById } from "@/lib/data";

export default async function AdminProgramPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  const program = await getProgramById(id);

  if (!program) {
    notFound();
  }

  return (
    <AdminLayout
      pathname="/admin/programs"
      title="Program Preview"
      email={user.email}
    >
      <ProgramDetailView
        program={program}
        previewMode
        backHref="/admin/programs"
        backLabel="Back to Program CMS"
      />
    </AdminLayout>
  );
}
