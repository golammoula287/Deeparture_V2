const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  if (process.env.NODE_ENV !== 'production') console.error(err);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV !== 'production' ? { error: err.name, stack: err.stack } : {}),
  });
};
module.exports = globalErrorHandler;
