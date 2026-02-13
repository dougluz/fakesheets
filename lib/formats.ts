import * as XLSX from "xlsx";

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

export function buildCSV(headers: string[], rows: string[][]): Blob {
  const lines: string[] = [];
  lines.push(headers.map(escapeCSVField).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCSVField).join(","));
  }
  const csv = "\uFEFF" + lines.join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

export function buildXLSX(headers: string[], rows: string[][]): Blob {
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
