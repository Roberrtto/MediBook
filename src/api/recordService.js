import { apiClient } from './client'

// FR-05, FR-09, FR-11

export const recordService = {
  /** FR-05 / FR-11: read-only historical visit summaries, prescriptions, lab results. */
  getPatientRecords: (patientId) =>
    apiClient.get('/records', { params: { patientId } }).then((res) => res.data),

  getVisitDetail: (visitId) =>
    apiClient.get(`/records/${visitId}`).then((res) => res.data),

  /** FR-09: doctor attaches a private clinical note to a patient's file post-consultation. */
  addClinicalNote: (appointmentId, { diagnosis, prescription, labOrders, note }) =>
    apiClient
      .post(`/appointments/${appointmentId}/notes`, { diagnosis, prescription, labOrders, note })
      .then((res) => res.data),
}
