import type { ReactNode } from "react";

type TableShellProps = { children: ReactNode };

export function TableShell({ children }: TableShellProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

export type TableColumn = { label: string; className?: string };

type TableHeadProps = { columns: TableColumn[] };

export function TableHead({ columns }: TableHeadProps) {
  return (
    <thead className="bg-background text-xs font-semibold uppercase tracking-wide text-gray">
      <tr>
        {columns.map((column) => (
          <th key={column.label} className={`px-4 py-3 ${column.className ?? ""}`}>
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
