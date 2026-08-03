'use strict'
const { PrismaClient } = require('@prisma/client')
const { authenticate, requireRole } = require('../middleware/authenticate')
const { writeAudit } = require('../utils/audit')
const { hashPassword } = require('../utils/hash')
const { notifyBookingConfirmed, notifyCancellation } = require('../utils/notify')
const { formatAppointment } = require('./doctors')

const prisma = new PrismaClient()

async function appointmentRoutes(fastify) {
  // ── POST /api/appointments ─────────────────────────────────────────────────
  // FR-03: book a slot. Uses a Prisma transaction + unique constraint on slotId
  // to prevent double-booking (FR-12) at the database level.
  fastify.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { doctorId, slotId, patientId, notes, isEmergency, emergencyReason } = request.body
    const actorId   = request.user.id
    const actorName = request.user.name
    const actorRole = request.user.role

    if (!doctorId || !slotId || !patientId) {
      return reply.status(400).send({ success: false, message: 'doctorId, slotId, and patientId are required.' })
    }

    // Patients can only book for themselves
    if (actorRole === 'PATIENT' && patientId !== actorId) {
      return reply.status(403).send({ success: false, message: 'Patients can only book for themselves.' })
    }

    if (actorRole === 'PATIENT') {
      const slot = await prisma.slot.findUnique({ where: { id: slotId } })
      if (!slot) {
        return reply.status(404).send({ success: false, message: 'Selected slot was not found.' })
      }

      const hoursUntil = (new Date(slot.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntil < 2) {
        return reply.status(400).send({
          success: false,
          message: 'You cannot book an appointment within 2 hours of the selected time. Please contact the reception desk for emergency booking.',
        })
      }
    }

    if (actorRole === 'RECEPTIONIST' && isEmergency) {
      const slot = await prisma.slot.findUnique({ where: { id: slotId } })
      if (!slot) {
        return reply.status(404).send({ success: false, message: 'Selected slot was not found.' })
      }
    }

    try {
      const appointment = await prisma.$transaction(async (tx) => {
        // Lock check — the unique constraint on slotId is the DB-level guard;
        // this check gives a friendlier error message before hitting the constraint.
        const slot = await tx.slot.findUnique({ where: { id: slotId } })
        if (!slot || slot.isBooked) {
          throw { code: 'SLOT_TAKEN', message: 'This time slot is no longer available. Please choose another.' }
        }

        const [appt] = await Promise.all([
          tx.appointment.create({
            data: {
              patientId,
              doctorId,
              slotId,
              status:          'CONFIRMED',
              reason:          notes || null,
              emergencyReason: actorRole === 'RECEPTIONIST' && isEmergency ? (emergencyReason || 'Emergency booking') : null,
              createdById:     actorId,
              createdByName:   actorName,
              createdByRole:   actorRole,
            },
            include: {
              patient: true,
              slot:    true,
              doctor:  { include: { user: { select: { name: true } } } },
            },
          }),
          tx.slot.update({ where: { id: slotId }, data: { isBooked: true } }),
        ])
        return appt
      })

      await writeAudit({
        user:        { id: actorId, name: actorName, role: actorRole },
        action:      'BOOK',
        resource:    'appointments',
        resourceId:  appointment.id,
        description: `${actorName} (${actorRole}) booked appointment for ${appointment.patient.name} with ${appointment.doctor.user.name}`,
        ipAddress:   request.ip,
      })

      // FR-10: confirmation SMS (stubbed until Twilio is set up)
      notifyBookingConfirmed(appointment.patient, appointment, appointment.doctor.user.name).catch(() => {})

      return reply.status(201).send({
        success: true,
        message: 'Appointment confirmed.',
        data: formatAppointment(appointment),
      })
    } catch (err) {
      if (err.code === 'SLOT_TAKEN' || err.code === 'P2002') {
        return reply.status(409).send({ success: false, message: err.message || 'This slot was just taken by another booking.' })
      }
      fastify.log.error(err)
      return reply.status(500).send({ success: false, message: 'Could not create the appointment.' })
    }
  })

  // ── GET /api/appointments ──────────────────────────────────────────────────
  // Dual-purpose: patient's own list (patientId param) OR receptionist calendar (date + optional doctorId)
  fastify.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const { patientId, date, doctorId } = request.query
    const actor = request.user

    let where = {}

    if (actor.role === 'PATIENT') {
      // Patients only see their own appointments
      where.patientId = actor.id
    } else if (actor.role === 'DOCTOR') {
      // Doctors see their own schedule
      const profile = await prisma.doctor.findUnique({ where: { userId: actor.id } })
      if (!profile) return reply.status(404).send({ success: false, message: 'Doctor profile not found.' })
      where.doctorId = profile.id
      if (date) {
        const d = new Date(date)
        const start = new Date(d); start.setHours(0, 0, 0, 0)
        const end   = new Date(d); end.setHours(23, 59, 59, 999)
        where.slot = { startTime: { gte: start, lte: end } }
      }
    } else {
      // RECEPTIONIST: filter by date and optional doctorId
      if (date) {
        const d = new Date(date)
        const start = new Date(d); start.setHours(0, 0, 0, 0)
        const end   = new Date(d); end.setHours(23, 59, 59, 999)
        where.slot = { startTime: { gte: start, lte: end } }
      }
      if (doctorId) where.doctorId = doctorId
      if (patientId) where.patientId = patientId
    }

    const appointments = await prisma.appointment.findMany({
      where,
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

  // ── GET /api/appointments/:id ──────────────────────────────────────────────
  fastify.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: request.params.id },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        slot:    true,
        doctor:  { include: { user: { select: { name: true } } } },
      },
    })

    if (!appointment) {
      return reply.status(404).send({ success: false, message: 'Appointment not found.' })
    }

    // Patients can only view their own appointments
    if (request.user.role === 'PATIENT' && appointment.patientId !== request.user.id) {
      return reply.status(403).send({ success: false, message: 'Access denied.' })
    }

    return reply.send({ success: true, data: formatAppointment(appointment) })
  })

  // ── PATCH /api/appointments/:id/cancel ────────────────────────────────────
  // FR-04: cancel — blocked within 2 hours of the slot (enforced server-side)
  fastify.patch('/:id/cancel', { preHandler: [authenticate] }, async (request, reply) => {
    const appointment = await prisma.appointment.findUnique({
      where: { id: request.params.id },
      include: {
        patient: true,
        slot:    true,
        doctor:  { include: { user: { select: { name: true } } } },
      },
    })

    if (!appointment) {
      return reply.status(404).send({ success: false, message: 'Appointment not found.' })
    }
    if (appointment.status === 'CANCELLED') {
      return reply.status(400).send({ success: false, message: 'This appointment is already cancelled.' })
    }

    // Patients can only cancel their own
    if (request.user.role === 'PATIENT' && appointment.patientId !== request.user.id) {
      return reply.status(403).send({ success: false, message: 'Access denied.' })
    }

    // FR-04: 2-hour cancellation window enforced here on the server
    const hoursUntil = (new Date(appointment.slot.startTime) - Date.now()) / (1000 * 60 * 60)
    if (request.user.role === 'PATIENT' && hoursUntil < 2) {
      return reply.status(400).send({
        success: false,
        message: 'Appointments cannot be cancelled within 2 hours of the scheduled time. Please call the clinic instead.',
      })
    }

    // Receptionist can override the 2-hour restriction for emergency rescheduling/cancel actions.

    const before = { status: appointment.status }

    const updated = await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status:              'CANCELLED',
          lastModifiedById:    request.user.id,
          lastModifiedByName:  request.user.name,
          lastModifiedByRole:  request.user.role,
          lastModifiedAt:      new Date(),
        },
      }),
      // Release the slot so others can book it
      prisma.slot.update({ where: { id: appointment.slotId }, data: { isBooked: false } }),
    ])

    await writeAudit({
      user:        request.user,
      action:      'CANCEL',
      resource:    'appointments',
      resourceId:  appointment.id,
      description: `${request.user.name} (${request.user.role}) cancelled appointment #${appointment.id.slice(-6)} for patient ${appointment.patient.name}`,
      metadata:    { before, after: { status: 'CANCELLED' } },
      ipAddress:   request.ip,
    })

    // FR-10: cancellation SMS
    notifyCancellation(appointment.patient, appointment, appointment.doctor.user.name).catch(() => {})

    return reply.send({ success: true, message: 'Appointment cancelled.', data: updated[0] })
  })

  // ── PATCH /api/appointments/:id/reschedule ────────────────────────────────
  fastify.patch('/:id/reschedule', { preHandler: [authenticate] }, async (request, reply) => {
    const { newSlotId, isEmergency, emergencyReason } = request.body
    const appointment = await prisma.appointment.findUnique({
      where: { id: request.params.id },
      include: { slot: true, patient: true, doctor: { include: { user: true } } },
    })

    if (!appointment) return reply.status(404).send({ success: false, message: 'Appointment not found.' })
    if (appointment.status === 'CANCELLED') {
      return reply.status(400).send({ success: false, message: 'Cannot reschedule a cancelled appointment.' })
    }
    if (request.user.role === 'PATIENT' && appointment.patientId !== request.user.id) {
      return reply.status(403).send({ success: false, message: 'Access denied.' })
    }

    const hoursUntil = (new Date(appointment.slot.startTime) - Date.now()) / (1000 * 60 * 60)
    if (request.user.role === 'PATIENT' && hoursUntil < 2) {
      return reply.status(400).send({ success: false, message: 'Cannot reschedule within 2 hours of the appointment.' })
    }

    if (request.user.role === 'RECEPTIONIST') {
      const newSlot = await prisma.slot.findUnique({ where: { id: newSlotId } })
      if (!newSlot) {
        return reply.status(404).send({ success: false, message: 'The selected replacement slot was not found.' })
      }

      if (!isEmergency) {
        const replacementHoursUntil = (new Date(newSlot.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
        if (replacementHoursUntil < 2) {
          return reply.status(400).send({
            success: false,
            message: 'Receptionist emergency override is required for bookings within 2 hours of the selected time.',
          })
        }
      }
    }

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const newSlot = await tx.slot.findUnique({ where: { id: newSlotId } })
        if (!newSlot || newSlot.isBooked) {
          throw { code: 'SLOT_TAKEN', message: 'The new slot is no longer available.' }
        }
        const [appt] = await Promise.all([
          tx.appointment.update({
            where: { id: appointment.id },
            data: {
              slotId:              newSlotId,
              emergencyReason:     request.user.role === 'RECEPTIONIST' && isEmergency ? (emergencyReason || 'Emergency reschedule') : null,
              lastModifiedById:    request.user.id,
              lastModifiedByName:  request.user.name,
              lastModifiedByRole:  request.user.role,
              lastModifiedAt:      new Date(),
            },
          }),
          tx.slot.update({ where: { id: appointment.slotId }, data: { isBooked: false } }),
          tx.slot.update({ where: { id: newSlotId },          data: { isBooked: true  } }),
        ])
        return appt
      })

      await writeAudit({
        user:        request.user,
        action:      'RESCHEDULE',
        resource:    'appointments',
        resourceId:  appointment.id,
        description: `${request.user.name} (${request.user.role}) rescheduled appointment for ${appointment.patient.name}`,
        metadata:    { before: { slotId: appointment.slotId }, after: { slotId: newSlotId } },
        ipAddress:   request.ip,
      })

      return reply.send({ success: true, message: 'Appointment rescheduled.', data: updated })
    } catch (err) {
      if (err.code === 'SLOT_TAKEN' || err.code === 'P2002') {
        return reply.status(409).send({ success: false, message: err.message })
      }
      return reply.status(500).send({ success: false, message: 'Reschedule failed.' })
    }
  })

  // ── POST /api/appointments/walk-in ────────────────────────────────────────
  // FR-07: receptionist books a walk-in or emergency patient
  fastify.post('/walk-in', {
    preHandler: [authenticate, requireRole('RECEPTIONIST')],
  }, async (request, reply) => {
    const { patientName, patientPhone, doctorId, slotId, patientId, isEmergency, emergencyReason } = request.body

    if (!doctorId || !slotId) {
      return reply.status(400).send({ success: false, message: 'doctorId and slotId are required.' })
    }
    if (!patientId && !patientName) {
      return reply.status(400).send({ success: false, message: 'Either patientId or patientName must be provided.' })
    }

    const slot = await prisma.slot.findUnique({ where: { id: slotId } })
    if (!slot) {
      return reply.status(404).send({ success: false, message: 'Selected slot was not found.' })
    }

    if (!isEmergency) {
      const hoursUntil = (new Date(slot.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntil < 2) {
        return reply.status(400).send({
          success: false,
          message: 'Receptionist emergency override is required for bookings within 2 hours of the selected time.',
        })
      }
    }

    try {
      const appointment = await prisma.$transaction(async (tx) => {
        const slot = await tx.slot.findUnique({ where: { id: slotId } })
        if (!slot || slot.isBooked) {
          throw { code: 'SLOT_TAKEN', message: 'This slot is already taken.' }
        }

        let resolvedPatientId = patientId

        if (!resolvedPatientId) {
          const trimmedName = (patientName || '').trim()
          const trimmedPhone = (patientPhone || '').trim()
          const baseEmail = (trimmedName || 'patient')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '.')
            .replace(/^\.+|\.+$/g, '') || 'patient'

          const guestUser = await tx.user.create({
            data: {
              name:         trimmedName,
              email:        `${baseEmail}.${Date.now()}@guest.medibook.local`,
              phone:        trimmedPhone || null,
              passwordHash: await hashPassword(`guest-${Date.now()}-${Math.random().toString(36).slice(2)}`),
              role:         'PATIENT',
              isActive:     true,
              notifications: {
                smsReminder: true,
                smsConfirmation: true,
                emailSummary: true,
              },
            },
          })
          resolvedPatientId = guestUser.id
        }

        const [appt] = await Promise.all([
          tx.appointment.create({
            data: {
              patientId:        resolvedPatientId,
              doctorId,
              slotId,
              status:          'CONFIRMED',
              isWalkIn:        true,
              walkInName:      patientId ? null : patientName,
              walkInPhone:     patientId ? null : (patientPhone || null),
              emergencyReason: isEmergency ? (emergencyReason || 'Emergency booking') : null,
              createdById:     request.user.id,
              createdByName:   request.user.name,
              createdByRole:   'RECEPTIONIST',
            },
            include: {
              patient: { select: { id: true, name: true, phone: true } },
              slot:    true,
              doctor:  { include: { user: { select: { name: true } } } },
            },
          }),
          tx.slot.update({ where: { id: slotId }, data: { isBooked: true } }),
        ])
        return appt
      })

      await writeAudit({
        user:        request.user,
        action:      'WALK_IN_BOOK',
        resource:    'appointments',
        resourceId:  appointment.id,
        description: `${request.user.name} (Receptionist) created walk-in booking for ${patientName || appointment.patient.name} with ${appointment.doctor.user.name}`,
        ipAddress:   request.ip,
      })

      return reply.status(201).send({
        success: true,
        message: 'Walk-in appointment created.',
        data: formatAppointment(appointment),
      })
    } catch (err) {
      if (err.code === 'SLOT_TAKEN' || err.code === 'P2002') {
        return reply.status(409).send({ success: false, message: err.message || 'Slot is already booked.' })
      }
      fastify.log.error(err)
      return reply.status(500).send({ success: false, message: 'Could not create walk-in appointment.' })
    }
  })

  // ── POST /api/appointments/:id/notes ──────────────────────────────────────
  // FR-09: doctor attaches a clinical note to an appointment after the visit
  fastify.post('/:id/notes', {
    preHandler: [authenticate, requireRole('DOCTOR')],
  }, async (request, reply) => {
    const { diagnosis, prescription, labOrders, note } = request.body

    const appointment = await prisma.appointment.findUnique({
      where:   { id: request.params.id },
      include: { patient: { select: { id: true, name: true } } },
    })

    if (!appointment) {
      return reply.status(404).send({ success: false, message: 'Appointment not found.' })
    }

    // Verify this is the doctor's own appointment
    const docProfile = await prisma.doctor.findUnique({ where: { userId: request.user.id } })
    if (!docProfile || appointment.doctorId !== docProfile.id) {
      return reply.status(403).send({ success: false, message: 'You can only add notes to your own appointments.' })
    }

    const existing = await prisma.medicalRecord.findUnique({ where: { appointmentId: appointment.id } })

    let record
    if (existing) {
      // Update existing record and stamp who last modified it
      const before = { diagnosis: existing.diagnosis, prescription: existing.prescription }
      record = await prisma.medicalRecord.update({
        where: { appointmentId: appointment.id },
        data: {
          diagnosis:           diagnosis   || existing.diagnosis,
          prescription:        prescription || existing.prescription,
          labOrders:           labOrders   || existing.labOrders,
          privateNote:         note        || existing.privateNote,
          lastModifiedById:    request.user.id,
          lastModifiedByName:  request.user.name,
          lastModifiedAt:      new Date(),
        },
      })
      await writeAudit({
        user:        request.user,
        action:      'ADD_NOTE',
        resource:    'records',
        resourceId:  record.id,
        description: `${request.user.name} updated clinical note for patient ${appointment.patient.name} (appointment #${appointment.id.slice(-6)})`,
        metadata:    { before, after: { diagnosis, prescription } },
        ipAddress:   request.ip,
      })
    } else {
      record = await prisma.medicalRecord.create({
        data: {
          patientId:     appointment.patientId,
          appointmentId: appointment.id,
          diagnosis:     diagnosis    || null,
          prescription:  prescription || null,
          labOrders:     labOrders    || null,
          privateNote:   note         || null,
          createdById:   request.user.id,
          createdByName: request.user.name,
        },
      })
      // Mark appointment as completed when a note is added
      await prisma.appointment.update({
        where: { id: appointment.id },
        data:  { status: 'COMPLETED', lastModifiedById: request.user.id,
                 lastModifiedByName: request.user.name, lastModifiedByRole: 'DOCTOR',
                 lastModifiedAt: new Date() },
      })
      await writeAudit({
        user:        request.user,
        action:      'ADD_NOTE',
        resource:    'records',
        resourceId:  record.id,
        description: `${request.user.name} added clinical note for patient ${appointment.patient.name} (appointment #${appointment.id.slice(-6)})`,
        ipAddress:   request.ip,
      })
    }

    return reply.status(201).send({
      success: true,
      message: 'Clinical note saved to patient file.',
      data:    record,
    })
  })
}

module.exports = appointmentRoutes
