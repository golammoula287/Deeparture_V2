const httpStatus = require("http-status");
const catchAsync = require("../../utilities/catchAsync");
const sendResponse = require("../../utilities/sendResponse");
const AppError = require("../../error/appError");
const { parseSpreadsheet } = require("../services/bulkFile.service");
const { importInventoryRows } = require("../services/inventoryImport.service");

const runImport = catchAsync(async (req, res) => {
  const rows = req.file ? await parseSpreadsheet(req.file) : req.body.rows;
  if (!Array.isArray(rows)) throw new AppError(httpStatus.BAD_REQUEST, "Provide rows or a CSV/XLSX file");
  const importType = req.params.importType;
  const items = await importInventoryRows({ organisationId: req.params.organisationId, importType, rows });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: `${importType} import complete`, data: { imported: items.length, items } });
});

module.exports = { runImport };
