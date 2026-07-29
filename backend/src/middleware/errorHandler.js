// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  if (!err.isOperational) {
    // Unexpected/programmer error - log full detail server-side, don't leak it to the client
    console.error('UNEXPECTED ERROR:', err);
  }
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Something went wrong. Please try again.',
  });
}

module.exports = errorHandler;
