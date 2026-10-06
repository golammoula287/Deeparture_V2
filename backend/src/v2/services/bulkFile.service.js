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
    if (char === '"' && quoted && next === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((value) => value !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows.shift().map((h) => h.trim());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
};

const valueOf = (cell) => {
  let value = cell.value;
  if (value && typeof value === "object") {
    if ("text" in value) value = value.text;
    else if ("result" in value) value = value.result;
    else if (Array.isArray(value.richText)) value = value.richText.map((p) => p.text).join("");
  }
  return value ?? "";
};

const rowsFromWorksheet = (worksheet) => {
  if (!worksheet) return [];
  const headers = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => { headers[col] = String(valueOf(cell) || "").trim(); });
  const rows = [];
  worksheet.eachRow((excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    const record = {};
    let hasValue = false;
    headers.forEach((header, col) => {
      if (!header) return;
      const value = valueOf(excelRow.getCell(col));
      if (value !== "") hasValue = true;
      record[header] = value;
    });
    if (hasValue) rows.push(record);
  });
  return rows;
};

const loadWorkbook = async (file) => {
  // eslint-disable-next-line global-require
  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  return workbook;
};

const parseSpreadsheet = async (file, { sheetNames = [] } = {}) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext === ".csv" || file.mimetype === "text/csv") return parseCsv(file.buffer.toString("utf8"));
  if (ext !== ".xlsx") throw new Error("Upload a CSV or XLSX file");
  const workbook = await loadWorkbook(file);
  let worksheet = null;
  for (const name of sheetNames) {
    worksheet = workbook.worksheets.find((ws) => ws.name.toLowerCase() === String(name).toLowerCase());
    if (worksheet) break;
  }
  worksheet ||= workbook.worksheets[0];
  return rowsFromWorksheet(worksheet);
};

const parseCatalogSpreadsheet = async (file, productType) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext === ".csv" || file.mimetype === "text/csv") return { rows: parseCsv(file.buffer.toString("utf8")), sourceType: "csv" };
  if (ext !== ".xlsx") throw new Error("Upload a CSV or XLSX file");
  const workbook = await loadWorkbook(file);
  const productNames = productType === "resort" ? ["Resorts", "Resort"] : ["Liveaboards", "Vessels", "Liveaboard"];
  let productSheet = null;
  for (const name of productNames) {
    productSheet = workbook.worksheets.find((ws) => ws.name.toLowerCase() === name.toLowerCase());
    if (productSheet) break;
  }
  productSheet ||= workbook.worksheets[0];
  const rows = rowsFromWorksheet(productSheet);

  // Optional Operators sheet. Product rows may reference operatorKey/operatorId/operatorName.
  const operatorSheet = workbook.worksheets.find((ws) => ["operators", "organisations", "organizations"].includes(ws.name.toLowerCase()));
  if (operatorSheet) {
    const operators = rowsFromWorksheet(operatorSheet);
    const index = new Map();
    for (const op of operators) {
      for (const key of [op.operatorKey, op.operatorId, op.organisationId, op.operatorName, op.organisationName, op.companyName]) {
        if (key) index.set(String(key).trim().toLowerCase(), op);
      }
    }
    for (const row of rows) {
      const key = row.operatorKey || row.operatorId || row.organisationId || row.operatorName || row.organisationName;
      const op = key ? index.get(String(key).trim().toLowerCase()) : null;
      if (op) Object.assign(row, { ...op, ...row });
    }
  }
  return { rows, sourceType: "xlsx" };
};

module.exports = { parseCsv, parseSpreadsheet, parseCatalogSpreadsheet, rowsFromWorksheet };
