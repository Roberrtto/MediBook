'use strict'
const cfg = require('../config')

/**
 * Send an SMS via Twilio.
 * When TWILIO_* env vars are not set (local dev), logs to console instead.
 */
async function sendSMS(to, message) {
  if (!cfg.TWILIO_SID || !cfg.TWILIO_TOKEN || !cfg.TWILIO_FROM) {
    console.log(`[SMS STUB] To: ${to}\n  Message: ${message}\n`)
    return
  }
  // Real implementation — only runs when keys are configured:
  // const twilio = require('twilio')(cfg.TWILIO_SID, cfg.TWILIO_TOKEN)
  // await twilio.messages.create({ body: message, from: cfg.TWILIO_FROM, to })
}

/**
 * Send an email via SendGrid.
 * When SENDGRID_API_KEY is not set, logs to console instead.
 */
async function sendEmail(to, subject, body) {
  if (!cfg.SENDGRID_KEY) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}\n  Body: ${body}\n`)
    return
  }
  // Real implementation:
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(cfg.SENDGRID_KEY)
  // await sgMail.send({ to, from: cfg.FROM_EMAIL, subject, text: body })
}

// ── Notification message templates ────────────────────────────────────────────

async function notifyBookingConfirmed(patient, appointment, doctorName) {
  if (!patient.notifications?.smsConfirmation) return
  await sendSMS(
    patient.phone,
    `MediBook: Your appointment with ${doctorName} on ${formatDT(appointment.slot.startTime)} is confirmed. Ref #${appointment.id.slice(-6).toUpperCase()}.`
  )
}

async function notifyCancellation(patient, appointment, doctorName) {
  if (!patient.notifications?.smsConfirmation) return
  await sendSMS(
    patient.phone,
    `MediBook: Your appointment with ${doctorName} on ${formatDT(appointment.slot.startTime)} has been cancelled. Call the clinic to rebook.`
  )
}

async function notifyRegistration(user) {
  await sendSMS(
    user.phone,
    `Welcome to MediBook, ${user.name.split(' ')[0]}! Your patient account is ready. You can now book appointments online.`
  )
  await sendEmail(
    user.email,
    'Welcome to MediBook',
    `Hi ${user.name},\n\nYour MediBook patient account has been created.\nYou can now log in and book appointments.\n\nMediBook Clinic`
  )
}

async function notifyReminder(patient, appointment, doctorName) {
  if (!patient.notifications?.smsReminder) return
  await sendSMS(
    patient.phone,
    `MediBook REMINDER: You have an appointment with ${doctorName} TOMORROW at ${formatTime(appointment.slot.startTime)}. Reply CANCEL to cancel (at least 2 hrs before).`
  )
}

function formatDT(date) {
  return new Date(date).toLocaleString('en-KE', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function formatTime(date) {
  return new Date(date).toLocaleString('en-KE', { hour: 'numeric', minute: '2-digit' })
}

module.exports = {
  sendSMS,
  sendEmail,
  notifyBookingConfirmed,
  notifyCancellation,
  notifyRegistration,
  notifyReminder,
}
