'use strict'
const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const { notifyReminder } = require('../utils/notify')

const prisma = new PrismaClient()

/**
 * FR-10: Reminder cron job — runs every hour.
 * Finds all confirmed appointments starting between 23h and 25h from now,
 * sends an SMS via Twilio to each patient who opted in, then marks reminderSent=true
 * so they don't receive duplicate reminders.
 */
function startReminderJob() {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running 24-hour appointment reminder job...')

    const now       = new Date()
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    try {
      const upcoming = await prisma.appointment.findMany({
        where: {
          status:       'CONFIRMED',
          reminderSent: false,
          isWalkIn:     false,
          slot: {
            startTime: { gte: in23Hours, lte: in25Hours },
          },
        },
        include: {
          patient: true,
          slot:    true,
          doctor:  { include: { user: { select: { name: true } } } },
        },
      })

      for (const appt of upcoming) {
        const prefs = appt.patient.notifications || {}
        if (prefs.smsReminder && appt.patient.phone) {
          await notifyReminder(appt.patient, appt, appt.doctor.user.name)
          await prisma.appointment.update({
            where: { id: appt.id },
            data:  { reminderSent: true },
          })
          console.log(`[CRON] Reminder sent → ${appt.patient.name} (${appt.patient.phone})`)
        }
      }

      console.log(`[CRON] Done. Processed ${upcoming.length} appointment(s).`)
    } catch (err) {
      console.error('[CRON] Reminder job error:', err.message)
    }
  })

  console.log('[CRON] 24-hour reminder job scheduled (runs every hour).')
}

module.exports = { startReminderJob }
