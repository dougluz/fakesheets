interface PreviewTableProps {
  headers: string[];
  rows: string[][];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="bg-surface-dark rounded-2xl border border-border-dark overflow-hidden">
      <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Preview Data
        </h3>
        <span className="text-xs text-slate-500">
          Showing {rows.length} rows
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-dark">
          <thead className="bg-slate-800">
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface-dark divide-y divide-border-dark">
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`transition-colors ${
                  i % 2 === 0
                    ? "hover:bg-slate-800/50"
                    : "bg-slate-800/30 hover:bg-slate-800/50"
                }`}
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-300"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
