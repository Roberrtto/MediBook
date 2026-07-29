/**
 * A predictable, HTTP-status-aware error we throw on purpose
 * (e.g. "slot already taken"), as opposed to a bug/crash.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
