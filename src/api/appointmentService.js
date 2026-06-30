import { apiClient } from './client'

// FR-02, FR-03, FR-04, FR-06, FR-07, FR-12

export const appointmentService = {
  /** FR-02: real-time available slots filtered by doctor and/or specialty. */
  getAvailableSlots: ({ doctorId, specialty, date }) =>
    apiClient
      .get('/slots', { params: { doctorId, specialty, date } })
      .then((res) => res.data),

  /** FR-03: instant reservation. Backend returns a unique appointment ID,
   *  or a 409 if FR-12's transaction lock caught a clash. */
  bookAppointment: ({ doctorId, slotId, patientId, notes }) =>
    apiClient
      .post('/appointments', { doctorId, slotId, patientId, notes })
      .then((res) => res.data),

  /** FR-04: cancel/reschedule, blocked server-side inside the 2-hour window. */
  cancelAppointment: (appointmentId) =>
    apiClient.patch(`/appointments/${appointmentId}/cancel`).then((res) => res.data),

  rescheduleAppointment: (appointmentId, { newSlotId }) =>
    apiClient
      .patch(`/appointments/${appointmentId}/reschedule`, { newSlotId })
      .then((res) => res.data),

  /** Appointments for the logged-in patient. */
  getMyAppointments: (patientId) =>
    apiClient.get('/appointments', { params: { patientId } }).then((res) => res.data),

  /** FR-06: centralized calendar for receptionists — all appointments for a day/range. */
  getClinicSchedule: ({ date, doctorId }) =>
    apiClient.get('/appointments', { params: { date, doctorId } }).then((res) => res.data),

  /** FR-07: manual booking/cancellation for walk-in or emergency patients. */
  createWalkInAppointment: ({ patientName, patientPhone, doctorId, slotId }) =>
    apiClient
      .post('/appointments/walk-in', { patientName, patientPhone, doctorId, slotId })
      .then((res) => res.data),

  /** FR-08: chronological daily schedule for a doctor. */
  getDoctorDailySchedule: ({ doctorId, date }) =>
    apiClient.get('/doctors/schedule', { params: { doctorId, date } }).then((res) => res.data),

  /** List of doctors + specialties, used to populate booking filters. */
  getDoctors: () => apiClient.get('/doctors').then((res) => res.data),

  /** Single appointment detail, used to open a patient's chart from the doctor's schedule. */
  getAppointmentById: (appointmentId) =>
    apiClient.get(`/appointments/${appointmentId}`).then((res) => res.data),
}
