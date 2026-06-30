import axios from 'axios'

// Single base URL switch point. Point this at Maida's API once it's deployed —
// nothing else in the frontend needs to change.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach JWT (FR-01) to every outgoing request, if present.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('medibook_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize errors so every UI layer can rely on err.message and err.status.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      (status === undefined
        ? 'Cannot reach the server. Is the backend running?'
        : 'Something went wrong. Please try again.')
    return Promise.reject({ status, message, raw: error })
  },
)
