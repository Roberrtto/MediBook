const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

/**
 * Every network call in the app goes through this one function. Centralizing
 * fetch + error handling here means components/pages never touch fetch()
 * directly - if we need to add retry logic or change the base URL, it's a
 * one-file change (Single Responsibility Principle applied to the frontend).
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data.data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  listDoctors: (token) => request('/doctors', { token }),

  bookAppointment: (payload, token) =>
    request('/appointments', { method: 'POST', body: payload, token }),
  cancelAppointment: (id, token) =>
    request(`/appointments/${id}/cancel`, { method: 'PATCH', token }),
  myAppointments: (token) => request('/appointments/mine', { token }),
  doctorSchedule: (token, date) =>
    request(`/appointments/schedule${date ? `?date=${date}` : ''}`, { token }),
  allAppointments: (token) => request('/appointments', { token }),

  myMedicalHistory: (token) => request('/medical-records/mine', { token }),
  addMedicalRecord: (payload, token) =>
    request('/medical-records', { method: 'POST', body: payload, token }),
};
