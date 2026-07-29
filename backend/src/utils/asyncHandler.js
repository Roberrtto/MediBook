// Wraps an async route handler so any thrown/rejected error is forwarded
// to errorHandler.js instead of crashing the process or needing try/catch
// in every single controller function.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
