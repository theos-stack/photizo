import { EmptyState } from "@/components/EmptyState";
import { AdminLayout } from "@/components/AdminLayout";
import { Container } from "@/components/Container";
import { ProgramDetailView } from "@/components/programs/ProgramDetailView";
import { getProgramById } from "@/lib/data";
import { requireAdmin } from "@/lib/server/auth";

export default async function AdminProgramPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const user = await requireAdmin();
  const { program: programId } = await searchParams;
  const program = programId ? await getProgramById(programId) : null;

  return (
    <AdminLayout
      pathname="/admin/programs"
      title="Program Preview"
      email={user.email}
    >
      {program ? (
        <ProgramDetailView
          program={program}
          previewMode
          backHref="/admin/programs"
          backLabel="Back to Program CMS"
        />
      ) : (
        <Container className="px-0">
          <EmptyState
            title="Select a program to preview"
            description="Choose Preview from the Program CMS table and PHOTIZO will open the full program page preview here."
            actionHref="/admin/programs"
            actionLabel="Back to Program CMS"
          />
        </Container>
      )}
    </AdminLayout>
  );
}
