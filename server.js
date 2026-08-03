'use strict'
require('dotenv').config()

const fastify = require('fastify')({ logger: { level: process.env.LOG_LEVEL || 'info' } })
const cfg     = require('./src/config')
const { startReminderJob } = require('./src/jobs/reminderJob')

fastify.decorate('config', cfg)

fastify.register(require('@fastify/helmet'))
fastify.register(require('@fastify/cors'), {
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
})
fastify.register(require('@fastify/jwt'), {
  secret: cfg.JWT_SECRET,
})

fastify.register(require('./src/routes/auth'),         { prefix: '/api/auth' })
fastify.register(require('./src/routes/appointments'), { prefix: '/api/appointments' })
fastify.register(require('./src/routes/doctors'),      { prefix: '/api/doctors' })
fastify.register(require('./src/routes/records'),      { prefix: '/api/records' })
fastify.register(require('./src/routes/audit'),        { prefix: '/api/audit' })
fastify.register(require('./src/routes/slots'),        { prefix: '/api/slots' })

fastify.get('/health', async () => ({
  status:    'ok',
  service:   'MediBook API',
  timestamp: new Date().toISOString(),
}))

const start = async () => {
  try {
    await fastify.listen({ port: cfg.PORT, host: '0.0.0.0' })
    console.log(`\n🏥  MediBook API running on http://localhost:${cfg.PORT}`)
    console.log(`📋  Health check: http://localhost:${cfg.PORT}/health\n`)
    startReminderJob()
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()