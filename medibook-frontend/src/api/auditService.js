import { apiClient } from './client'

export const auditService = {
  getAuditLogs: (params = {}) =>
    apiClient
      .get('/audit', { params })
      .then((res) => res.data),
}
