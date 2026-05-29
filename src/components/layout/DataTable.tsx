import { ReactNode } from "react";

export function DataTable({
  headers,
  children,
  emptyMessage = "No records found.",
}: {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-300"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <p className="text-sm font-medium text-slate-400">{message || "No records found."}</p>
      </td>
    </tr>
  );
}
