import ExcelJS from "exceljs";

export function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

export function buildStreamingCSV(
  chunks: string[],
  headers: string
): Blob {
  const parts: BlobPart[] = ["\uFEFF"];
  parts.push(headers + "\n");
  for (const chunk of chunks) {
    parts.push(chunk);
    if (!chunk.endsWith("\n")) {
      parts.push("\n");
    }
  }
  return new Blob(parts, { type: "text/csv;charset=utf-8" });
}

export function buildStreamingJSON(headers: string[], dataChunks: string[][][]): Blob {
  const allRows: Record<string, string>[] = [];
  for (const chunk of dataChunks) {
    for (const row of chunk) {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      allRows.push(obj);
    }
  }
  return new Blob([JSON.stringify(allRows)], { type: "application/json" });
}

export async function buildStreamingXLSX(
  headers: string[],
  dataChunks: string[][][]
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data");

  worksheet.addRow(headers);

  for (const chunk of dataChunks) {
    for (const row of chunk) {
      worksheet.addRow(row);
    }
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function buildXLSXPreview(
  headers: string[],
  rows: string[][]
): Promise<Blob> {
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
