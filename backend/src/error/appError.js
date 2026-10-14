class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = options.code;
    this.details = options.details;
    this.operationId = options.operationId;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
module.exports = AppError;
