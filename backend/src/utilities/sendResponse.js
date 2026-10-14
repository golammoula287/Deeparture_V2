const sendResponse = (res, data) => res.status(data.statusCode).json({
  success: data.success,
  message: data.message,
  operationId: data.operationId || res.req?.operationId,
  data: data.data,
});
module.exports = sendResponse;
