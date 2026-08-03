'use strict'

/**
 * Fastify preHandler that verifies the JWT and attaches the decoded user
 * to request.user as { id, name, email, role }.
 *
 * Usage on a route:  { preHandler: [authenticate] }
 * Usage with a role: { preHandler: [authenticate, requireRole('DOCTOR')] }
 */
async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ success: false, message: 'Invalid or expired session. Please log in again.' })
  }
}

/**
 * Returns a preHandler that allows only the specified roles.
 * Must come after authenticate in the preHandler array.
 *
 * @param {...string} roles  e.g. requireRole('DOCTOR', 'RECEPTIONIST')
 */
function requireRole(...roles) {
  return async function (request, reply) {
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        message: `Access denied. This action requires one of: ${roles.join(', ')}.`,
      })
    }
  }
}

module.exports = { authenticate, requireRole }
