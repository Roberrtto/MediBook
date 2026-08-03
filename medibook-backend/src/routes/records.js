'use strict'
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireRole } = require('../middleware/authenticate')

const prisma = new PrismaClient()

async function recordRoutes(fastify) {
  // ── GET /api/records ───────────────────────────────────────────────────────
  // FR-05 / FR-11: read-only list of a patient's visit history
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { patientId } = request.query
    const actor = request.user

    // Patients can only view their own records
    const resolvedId = actor.role === 'PATIENT' ? actor.id : patientId
    if (!resolvedId) {
      return reply.status(400).send({ success: false, message: 'patientId is required.' })
    }
    if (actor.role === 'PATIENT' && resolvedId !== actor.id) {
      return reply.status(403).send({ success: false, message: 'Access denied.' })
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: resolvedId },
      include: {
        appointment: {
          include: {
            slot:   true,
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({
      success: true,
      data: records.map((r) => ({
        id:          r.id,
        date:        r.appointment?.slot?.startTime,
        doctorName:  r.appointment?.doctor?.user?.name,
        diagnosis:   r.diagnosis,
        // privateNote only returned to doctors
        ...(actor.role === 'DOCTOR' && { privateNote: r.privateNote }),
        // Audit trail
        createdByName:       r.createdByName,
        lastModifiedByName:  r.lastModifiedByName || null,
        lastModifiedAt:      r.lastModifiedAt     || null,
      })),
    })
  })

  // ── GET /api/records/:visitId ──────────────────────────────────────────────
  // FR-05: full detail of a single visit
  fastify.get('/:visitId', { preHandler: [authenticate] }, async (request, reply) => {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: request.params.visitId },
      include: {
        appointment: {
          include: {
            slot:    true,
            patient: { select: { id: true, name: true } },
            doctor:  { include: { user: { select: { name: true } } } },
          },
        },
      },
    })

    if (!record) {
      return reply.status(404).send({ success: false, message: 'Record not found.' })
    }

    // Patients can only view their own records
    if (request.user.role === 'PATIENT' && record.patientId !== request.user.id) {
      return reply.status(403).send({ success: false, message: 'Access denied.' })
    }

    return reply.send({
      success: true,
      data: {
        id:           record.id,
        date:         record.appointment?.slot?.startTime,
        doctorName:   record.appointment?.doctor?.user?.name,
        patientName:  record.appointment?.patient?.name,
        diagnosis:    record.diagnosis,
        prescription: record.prescription,
        labResults:   record.labOrders,
        // Private note only for doctors (NFR-01)
        ...(request.user.role === 'DOCTOR' && { privateNote: record.privateNote }),
        // Audit trail — who wrote this and whether it was subsequently modified
        createdByName:       record.createdByName,
        lastModifiedByName:  record.lastModifiedByName || null,
        lastModifiedAt:      record.lastModifiedAt     || null,
      },
    })
  })
}

module.exports = recordRoutes
