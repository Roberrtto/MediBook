import { apiClient } from './client'

// FR-01: Secure user registration and encrypted login verification.

export const authService = {
  /**
   * @param {{name: string, email: string, password: string, role: 'patient'}} payload
   * Receptionists/doctors are provisioned by clinic admins, not self-registered.
   */
  register: (payload) => apiClient.post('/auth/register', payload).then((res) => res.data),

  /**
   * @param {{email: string, password: string}} payload
   * @returns {{token: string, user: {id, name, email, role}}}
   */
  login: (payload) => apiClient.post('/auth/login', payload).then((res) => res.data),

  /** Fetches the current authenticated user from the token. */
  getCurrentUser: () => apiClient.get('/auth/me').then((res) => res.data),

  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
}
