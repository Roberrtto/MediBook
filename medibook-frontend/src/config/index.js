'use strict'
require('dotenv').config()

function required(key) {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

module.exports = {
  PORT:         process.env.PORT || 4000,
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET:   required('JWT_SECRET'),
  JWT_EXPIRES:  process.env.JWT_EXPIRES || '7d',
  NODE_ENV:     process.env.NODE_ENV || 'development',

  // FR-10 — Twilio (stubbed: logs to console when not set)
  TWILIO_SID:   process.env.TWILIO_ACCOUNT_SID || null,
  TWILIO_TOKEN: process.env.TWILIO_AUTH_TOKEN   || null,
  TWILIO_FROM:  process.env.TWILIO_PHONE_NUMBER || null,

  // FR-10 — SendGrid (stubbed)
  SENDGRID_KEY: process.env.SENDGRID_API_KEY || null,
  FROM_EMAIL:   process.env.FROM_EMAIL        || 'noreply@medibook.clinic',
}
