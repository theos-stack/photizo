import { EmptyState } from "@/components/EmptyState";

type Column = {
  key: string;
  label: string;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column[];
  data: T[];
  renderRow: (item: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function DataTable<T>({
  columns,
  data,
  renderRow,
  emptyTitle = "No records found",
  emptyDescription = "There is nothing to display for this view yet.",
}: DataTableProps<T>) {
  if (!data.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[rgba(72,108,38,0.12)] bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[var(--cultured)] text-xs uppercase tracking-[0.28em] text-[rgba(11,11,11,0.52)]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-5 py-4 font-semibold ${column.className ?? ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{data.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  );
}
