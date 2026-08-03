import test from 'node:test'
import assert from 'node:assert/strict'
import { canScheduleAt } from './format.js'

test('patients cannot book within 2 hours of the appointment time', () => {
  const future = new Date(Date.now() + 1000 * 60 * 90) // 90 minutes
  assert.equal(canScheduleAt(future, 'PATIENT', false), false)
})

test('patients can book when the appointment is more than 2 hours away', () => {
  const future = new Date(Date.now() + 1000 * 60 * 180) // 3 hours
  assert.equal(canScheduleAt(future, 'PATIENT', false), true)
})

test('receptionists can override the 2-hour rule for emergencies', () => {
  const future = new Date(Date.now() + 1000 * 60 * 30) // 30 minutes
  assert.equal(canScheduleAt(future, 'RECEPTIONIST', true), true)
})
