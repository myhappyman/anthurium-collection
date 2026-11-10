function normalizeCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const serialized =
    typeof value === "object" ? (JSON.stringify(value) ?? "") : String(value);
  const safeValue = /^[=+\-@]/.test(serialized)
    ? `'${serialized}`
    : serialized;

  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function serializeCsv(rows: readonly object[]) {
  if (rows.length === 0) {
    return "\uFEFF";
  }

  const columns = Object.keys(rows[0] ?? {});
  const lines = [
    columns.map(normalizeCell).join(","),
    ...rows.map((row) => {
      const record = Object.fromEntries(Object.entries(row));
      return columns.map((column) => normalizeCell(record[column])).join(",");
    }),
  ];

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
