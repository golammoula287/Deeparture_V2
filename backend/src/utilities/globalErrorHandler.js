const codeForStatus = (status) => {
  if (status === 400 || status === 422) return 'validation_error';
  if (status === 401) return 'authentication_error';
  if (status === 403) return 'permission_error';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 413 || status === 429) return 'rate_or_limit_error';
  return 'internal_error';
};

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : err.code === 11000 ? 409 : 500);
  if (process.env.NODE_ENV !== 'production') console.error(err);
  const details = err.details || (err.name === 'ValidationError'
    ? Object.fromEntries(Object.entries(err.errors || {}).map(([key, value]) => [key, value.message]))
    : err.code === 11000 ? { duplicateKeys: err.keyValue } : undefined);
  res.status(statusCode).json({
    success: false,
    code: err.code && typeof err.code === 'string' ? err.code : codeForStatus(statusCode),
    message: statusCode >= 500 ? 'Something went wrong' : (err.message || 'Request failed'),
    operationId: err.operationId || req.operationId,
    ...(details ? { details } : {}),
  });
};
module.exports = globalErrorHandler;
