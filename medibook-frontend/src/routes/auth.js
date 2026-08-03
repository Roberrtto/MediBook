'use strict'
const { PrismaClient } = require('@prisma/client')
const { hashPassword, verifyPassword } = require('../utils/hash')
const { writeAudit } = require('../utils/audit')
const { notifyRegistration } = require('../utils/notify')
const { authenticate } = require('../middleware/authenticate')

const prisma = new PrismaClient()

async function authRoutes(fastify) {
  // ── POST /api/auth/register ────────────────────────────────────────────────
  // FR-01: patient self-registration. Doctors/receptionists are provisioned by admins.
  fastify.post('/register', async (request, reply) => {
    const { name, email, phone, password, notifications } = request.body

    if (!name || !email || !password) {
      return reply.status(400).send({ success: false, message: 'Name, email, and password are required.' })
    }
    if (password.length < 8) {
      return reply.status(400).send({ success: false, message: 'Password must be at least 8 characters.' })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return reply.status(409).send({ success: false, message: 'An account with this email already exists.' })
    }

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        name,
        email:        email.toLowerCase(),
        phone:        phone || null,
        passwordHash,
        role:         'PATIENT',
        notifications: notifications || {
          smsReminder:     true,
          smsConfirmation: true,
          emailSummary:    true,
        },
      },
    })

    const token = fastify.jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { expiresIn: fastify.config.JWT_EXPIRES }
    )

    await writeAudit({
      user:        { id: user.id, name: user.name, role: user.role },
      action:      'REGISTER',
      resource:    'auth',
      resourceId:  user.id,
      description: `${user.name} created a patient account`,
      ipAddress:   request.ip,
    })

    // FR-10: welcome SMS/email (stubbed until Twilio keys are set)
    if (phone) notifyRegistration(user).catch(() => {})

    return reply.status(201).send({
      success: true,
      message: 'Account created successfully.',
      token,
      user: safeUser(user),
    })
  })

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body

    if (!email || !password) {
      return reply.status(400).send({ success: false, message: 'Email and password are required.' })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !user.isActive) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials.' })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ success: false, message: 'Invalid credentials.' })
    }

    const token = fastify.jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { expiresIn: fastify.config.JWT_EXPIRES }
    )

    await writeAudit({
      user:        { id: user.id, name: user.name, role: user.role },
      action:      'LOGIN',
      resource:    'auth',
      resourceId:  user.id,
      description: `${user.name} (${user.role}) signed in`,
      ipAddress:   request.ip,
    })

    return reply.send({
      success: true,
      token,
      user: safeUser(user),
    })
  })

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  fastify.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.id } })
    if (!user) return reply.status(404).send({ success: false, message: 'User not found.' })
    return reply.send({ success: true, user: safeUser(user) })
  })

  // ── POST /api/auth/logout ──────────────────────────────────────────────────
  // JWT is stateless — logout just logs the action. The client discards the token.
  fastify.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    await writeAudit({
      user:        request.user,
      action:      'LOGOUT',
      resource:    'auth',
      resourceId:  request.user.id,
      description: `${request.user.name} signed out`,
      ipAddress:   request.ip,
    })
    return reply.send({ success: true, message: 'Logged out successfully.' })
  })

  // ── PATCH /api/auth/me/notifications ──────────────────────────────────────
  // FR-10: patient updates their Twilio/SendGrid preferences
  fastify.patch('/me/notifications', { preHandler: [authenticate] }, async (request, reply) => {
    const { phone, notifications } = request.body

    const before = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { phone: true, notifications: true },
    })

    const user = await prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...(phone         !== undefined && { phone }),
        ...(notifications !== undefined && { notifications }),
      },
    })

    await writeAudit({
      user:        request.user,
      action:      'UPDATE_PREFS',
      resource:    'users',
      resourceId:  request.user.id,
      description: `${request.user.name} updated their notification preferences`,
      metadata:    { before, after: { phone: user.phone, notifications: user.notifications } },
      ipAddress:   request.ip,
    })

    return reply.send({ success: true, message: 'Preferences saved.', user: safeUser(user) })
  })
}

// Strip sensitive fields before sending user to client
function safeUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

module.exports = authRoutes
