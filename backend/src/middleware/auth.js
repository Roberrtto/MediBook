const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authentication token missing.', 401));
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, name }
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token.', 401));
  }
}

/**
 * Usage: router.post('/', authenticate, authorize('doctor', 'receptionist'), handler)
 * Keeps role-based access control (RBAC, NFR-01) declarative at the route level
 * instead of scattered `if` checks inside every controller.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
