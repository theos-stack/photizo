import Link from "next/link";

import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/server/auth";
import { getBiblicalQuestions } from "@/lib/data";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const user = await requireAdmin();
  const filters = await searchParams;
  const questions = await getBiblicalQuestions(filters);

  return (
    <AdminLayout pathname="/admin/questions" title="Biblical Questions" email={user.email}>
      <Container className="space-y-6 px-0">
        <form className="grid gap-4 rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          <input
            name="search"
            defaultValue={filters.search || ""}
            placeholder="Search name, email, or question"
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status || ""}
            className="min-h-12 rounded-2xl border border-[rgba(72,108,38,0.14)] px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="in_review">In review</option>
            <option value="answered">Answered</option>
            <option value="needs_pastoral_attention">Needs pastoral attention</option>
            <option value="converted_to_teaching">Converted to teaching</option>
            <option value="archived">Archived</option>
          </select>
          <Button type="submit">Filter</Button>
        </form>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "permissions", label: "Response flags" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
          data={questions}
          renderRow={(question) => (
            <tr key={question.id} className="border-t border-[rgba(72,108,38,0.08)]">
              <td className="px-5 py-4">
                <div className="font-medium text-[var(--black)]">{question.full_name}</div>
                <div className="text-sm text-[rgba(11,11,11,0.52)]">{question.question.slice(0, 80)}...</div>
              </td>
              <td className="px-5 py-4 text-sm text-[rgba(11,11,11,0.72)]">{question.category}</td>
              <td className="px-5 py-4 text-xs text-[rgba(11,11,11,0.62)]">
                <div>Private: {question.wants_private_response ? "Yes" : "No"}</div>
                <div>Public teaching: {question.allow_public_answer ? "Allowed" : "Not allowed"}</div>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={question.status} />
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/admin/questions/${question.id}`}
                  className="text-sm font-semibold text-[var(--dark-moss-green)]"
                >
                  Open detail
                </Link>
              </td>
            </tr>
          )}
        />
      </Container>
    </AdminLayout>
  );
}
