'use strict'
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireRole } = require('../middleware/authenticate')

const prisma = new PrismaClient()

async function auditRoutes(fastify) {
  // ── GET /api/audit ─────────────────────────────────────────────────────────
  // Returns paginated audit log. Only the IT admin may view system activity logs.
  fastify.get('/', {
    preHandler: [authenticate, requireRole('IT_ADMIN')],
  }, async (request, reply) => {
    const { resource, resourceId, userId, limit = 50, offset = 0 } = request.query

    const where = {
      ...(resource   && { resource }),
      ...(resourceId && { resourceId }),
      ...(userId     && { userId }),
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:    parseInt(limit),
        skip:    parseInt(offset),
      }),
      prisma.auditLog.count({ where }),
    ])

    return reply.send({
      success: true,
      total,
      data: logs.map((l) => ({
        id:          l.id,
        userName:    l.userName,
        userRole:    l.userRole,
        action:      l.action,
        resource:    l.resource,
        resourceId:  l.resourceId,
        description: l.description,
        metadata:    l.metadata,
        ipAddress:   l.ipAddress,
        createdAt:   l.createdAt,
      })),
    })
  })
}

module.exports = auditRoutes
