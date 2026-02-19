import ExcelJS from "exceljs";

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

export async function buildXLSX(headers: string[], rows: string[][]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");
  
  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true };
  
  for (const row of rows) {
    worksheet.addRow(row);
  }
  
  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
