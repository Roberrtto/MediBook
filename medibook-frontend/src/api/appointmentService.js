import { apiClient } from './client'

export const appointmentService = {

  getAvailableSlots: ({ doctorId, specialty, date }) =>
    apiClient
      .get('/slots', { params: { doctorId, specialty, date } })
      .then((res) => res.data.data),

  bookAppointment: ({ doctorId, slotId, patientId, notes, isEmergency = false, emergencyReason }) =>
    apiClient
      .post('/appointments', { doctorId, slotId, patientId, notes, isEmergency, emergencyReason })
      .then((res) => res.data.data),

  cancelAppointment: (appointmentId) =>
    apiClient
      .patch(`/appointments/${appointmentId}/cancel`)
      .then((res) => res.data.data),

  rescheduleAppointment: (appointmentId, { newSlotId, isEmergency = false, emergencyReason }) =>
    apiClient
      .patch(`/appointments/${appointmentId}/reschedule`, { newSlotId, isEmergency, emergencyReason })
      .then((res) => res.data.data),

  getMyAppointments: (patientId) =>
    apiClient
      .get('/appointments', { params: { patientId } })
      .then((res) => res.data.data),

  getClinicSchedule: ({ date, doctorId }) =>
    apiClient
      .get('/appointments', { params: { date, doctorId } })
      .then((res) => res.data.data),

  createWalkInAppointment: ({ patientName, patientPhone, doctorId, slotId, isEmergency = false, emergencyReason }) =>
    apiClient
      .post('/appointments/walk-in', { patientName, patientPhone, doctorId, slotId, isEmergency, emergencyReason })
      .then((res) => res.data.data),

  getDoctorDailySchedule: ({ doctorId, date }) =>
    apiClient
      .get('/doctors/schedule', { params: { doctorId, date } })
      .then((res) => res.data.data),

  getDoctors: () =>
    apiClient
      .get('/doctors')
      .then((res) => res.data.data),

  getAppointmentById: (appointmentId) =>
    apiClient
      .get(`/appointments/${appointmentId}`)
      .then((res) => res.data.data),
}