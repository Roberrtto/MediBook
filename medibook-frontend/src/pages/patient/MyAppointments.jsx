import { useState } from 'react'
import { CalendarX2, CalendarClock } from 'lucide-react'
import { Card, CardBody } from '../../components/ui/Card'
import { StatusBadge, RecordTag } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, isWithinCancellationWindow } from '../../utils/format'

export default function MyAppointments() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [cancelTarget, setCancelTarget] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const { data, isLoading, error, refetch } = useApi(
    () => appointmentService.getMyAppointments(user.id),
    [user.id],
  )

  const appointments = (data || []).sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await appointmentService.cancelAppointment(cancelTarget.id)
      showToast('Appointment cancelled. Your slot has been released.', 'success')
      setCancelTarget(null)
      refetch()
    } catch (err) {
      showToast(err.message || 'Could not cancel — it may be within the 2-hour window.', 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">My appointments</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Cancellations and reschedules are allowed up to 2 hours before your visit.
        </p>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading && <Spinner label="Loading your appointments…" />}
          {!isLoading && error && <ErrorState message={error.message} onRetry={refetch} />}
          {!isLoading && !error && appointments.length === 0 && (
            <EmptyState
              icon={CalendarClock}
              title="No appointments yet"
              description="Appointments you book will appear here, past and upcoming."
            />
          )}
          {!isLoading && !error && appointments.length > 0 && (
            <ul className="divide-y divide-surface-border">
              {appointments.map((appt) => {
                const locked = isWithinCancellationWindow(appt.startTime) || appt.status === 'cancelled' || appt.status === 'completed'
                return (
                  <li key={appt.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div>
                        <p className="font-medium text-ink">{appt.doctorName}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{formatDateTime(appt.startTime)}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <RecordTag id={appt.id} status={appt.status} />
                          <StatusBadge status={appt.status} />
                        </div>
                      </div>
                    </div>
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={locked}
                        title={locked ? 'Within 2 hours of the appointment — call the clinic instead' : undefined}
                        onClick={() => setCancelTarget(appt)}
                        className="self-start sm:self-auto"
                      >
                        <CalendarX2 size={14} /> Cancel
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this appointment?"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep appointment</Button>
            <Button variant="danger" isLoading={isCancelling} onClick={handleCancel}>
              Yes, cancel
            </Button>
          </>
        }
      >
        {cancelTarget && (
          <p className="text-sm text-ink-muted">
            This will release your slot with <span className="font-medium text-ink">{cancelTarget.doctorName}</span> on{' '}
            <span className="font-medium text-ink">{formatDateTime(cancelTarget.startTime)}</span>. This can't be undone.
          </p>
        )}
      </Modal>
    </div>
  )
}
