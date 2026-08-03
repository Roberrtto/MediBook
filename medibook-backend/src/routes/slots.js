'use strict'
const { PrismaClient } = require('@prisma/client')
const { authenticate } = require('../middleware/authenticate')

const prisma = new PrismaClient()

async function slotRoutes(fastify) {
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { doctorId, specialty, date } = request.query

    const targetDate = date ? new Date(date) : new Date()
    const dayStart   = new Date(targetDate); dayStart.setHours(0, 0, 0, 0)
    const dayEnd     = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999)

    const slots = await prisma.slot.findMany({
      where: {
        isBooked:  false,
        startTime: { gte: dayStart, lte: dayEnd },
        ...(doctorId  && { doctorId }),
        ...(specialty && { doctor: { specialty } }),
      },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { startTime: 'asc' },
    })

    return reply.send({
      success: true,
      data: slots.map((s) => ({
        id:         s.id,
        doctorId:   s.doctorId,
        doctorName: s.doctor?.user?.name,
        specialty:  s.doctor?.specialty,
        startTime:  s.startTime,
        endTime:    s.endTime,
      })),
    })
  })
}

module.exports = slotRoutes