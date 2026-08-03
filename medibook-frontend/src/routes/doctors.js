'use strict'
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireRole } = require('../middleware/authenticate')

const prisma = new PrismaClient()

async function doctorRoutes(fastify) {
  // ── GET /api/doctors ───────────────────────────────────────────────────────
  // Returns all active doctors with specialty info — used to populate booking dropdowns
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const doctors = await prisma.doctor.findMany({
      where: { user: { isActive: true } },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { specialty: 'asc' },
    })

    return reply.send({
      success: true,
      data: doctors.map((d) => ({
        id:        d.id,
        userId:    d.userId,
        name:      d.user.name,
        specialty: d.specialty,
        bio:       d.bio,
      })),
    })
  })

  // ── GET /api/doctors/schedule ──────────────────────────────────────────────
  // FR-08: doctor's chronological daily schedule
  // FR-06 (receptionist): can view any doctor's schedule by passing doctorId
  fastify.get('/schedule', { preHandler: [authenticate] }, async (request, reply) => {
    let { doctorId, date } = request.query

    // Security: a doctor can only see their own schedule
    if (request.user.role === 'DOCTOR') {
      const profile = await prisma.doctor.findUnique({ where: { userId: request.user.id } })
      if (!profile) return reply.status(404).send({ success: false, message: 'Doctor profile not found.' })
      doctorId = profile.id
    }

    if (!doctorId) {
      return reply.status(400).send({ success: false, message: 'doctorId is required.' })
    }

    const targetDate = date ? new Date(date) : new Date()
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        slot: { startTime: { gte: dayStart, lte: dayEnd } },
        status: { not: 'CANCELLED' },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        slot:    true,
        doctor:  { include: { user: { select: { name: true } } } },
      },
      orderBy: { slot: { startTime: 'asc' } },
    })

    return reply.send({
      success: true,
      data: appointments.map(formatAppointment),
    })
  })
}

// ── Shared appointment formatter ───────────────────────────────────────────────
function formatAppointment(a) {
  return {
    id:                  a.id,
    patientId:           a.patientId,
    patientName:         a.isWalkIn ? a.walkInName : a.patient?.name,
    patientPhone:        a.isWalkIn ? a.walkInPhone : a.patient?.phone,
    doctorId:            a.doctorId,
    doctorName:          a.doctor?.user?.name,
    startTime:           a.slot?.startTime,
    endTime:             a.slot?.endTime,
    status:              a.status.toLowerCase(),
    reason:              a.reason,
    isWalkIn:            a.isWalkIn,
    // ── Audit trail fields shown in the UI to prevent ghost changes ──
    createdById:         a.createdById,
    createdByName:       a.createdByName,
    createdByRole:       a.createdByRole,
    lastModifiedByName:  a.lastModifiedByName || null,
    lastModifiedByRole:  a.lastModifiedByRole || null,
    lastModifiedAt:      a.lastModifiedAt     || null,
    createdAt:           a.createdAt,
  }
}

module.exports = doctorRoutes
module.exports.formatAppointment = formatAppointment
