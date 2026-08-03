export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return `${formatDate(dateStr)} · ${formatTime(dateStr)}`
}

/** FR-04: cancellation/reschedule only permitted up to 2 hours before the session. */
export function isWithinCancellationWindow(startTime) {
  const hoursUntil = (new Date(startTime).getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursUntil < 2
}

export function canScheduleAt(startTime, userRole, isEmergency = false) {
  const hoursUntil = (new Date(startTime).getTime() - Date.now()) / (1000 * 60 * 60)

  if (userRole === 'RECEPTIONIST' && isEmergency) {
    return true
  }

  return hoursUntil >= 2
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
