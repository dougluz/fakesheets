interface PreviewTableProps {
  headers: string[];
  rows: string[][];
}

export default function PreviewTable({ headers, rows }: PreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            {headers.map((header, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-850"
              }
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="whitespace-nowrap px-4 py-2 text-zinc-600 dark:text-zinc-400"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
