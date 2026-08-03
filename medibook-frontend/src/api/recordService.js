import { apiClient } from './client'

export const recordService = {

  getPatientRecords: (patientId) =>
    apiClient
      .get('/records', { params: { patientId } })
      .then((res) => res.data.data),

  getVisitDetail: (visitId) =>
    apiClient
      .get(`/records/${visitId}`)
      .then((res) => res.data.data),

  addClinicalNote: (appointmentId, { diagnosis, prescription, labOrders, note }) =>
    apiClient
      .post(`/appointments/${appointmentId}/notes`, {
        diagnosis,
        prescription,
        labOrders,
        note,
      })
      .then((res) => res.data.data),
}