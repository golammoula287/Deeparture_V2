const path = require("path");

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
};

const parseSpreadsheet = async (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext === ".csv" || file.mimetype === "text/csv") return parseCsv(file.buffer.toString("utf8"));
  if (![".xlsx", ".xls"].includes(ext)) throw new Error("Upload a CSV or XLSX file");
  // Loaded lazily so JSON/CSV imports still work if exceljs is not installed yet.
  // eslint-disable-next-line global-require
  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];
  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cell.value || "").trim();
  });
  const rows = [];
  worksheet.eachRow((excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    let hasValue = false;
    headers.forEach((header, col) => {
      if (!header) return;
      const cell = excelRow.getCell(col);
      let value = cell.value;
      if (value && typeof value === "object" && "text" in value) value = value.text;
      if (value !== null && value !== undefined && value !== "") hasValue = true;
      record[header] = value ?? "";
    });
    if (hasValue) rows.push(record);
  });
  return rows;
};

module.exports = { parseCsv, parseSpreadsheet };
