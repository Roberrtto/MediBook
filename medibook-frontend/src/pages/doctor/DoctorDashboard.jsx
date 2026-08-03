import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Form'
import { StatusBadge, RecordTag } from '../../components/ui/Badge'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { useAuth } from '../../context/AuthContext'
import { formatTime, todayISO } from '../../utils/format'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [date, setDate] = useState(todayISO())

  const { data, isLoading, error, refetch } = useApi(
    () => appointmentService.getDoctorDailySchedule({ date }),
    [date],
  )

  const schedule = (Array.isArray(data) ? data : [])
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Doctor schedule
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            View all appointments for the selected day in chronological order.
          </p>
        </div>
        <Field label="Select date" className="w-44">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>

      <Card>
        <CardHeader
          title={date === todayISO() ? "Today's patients" : `Patients for ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          subtitle={`${schedule.length} appointment${schedule.length === 1 ? '' : 's'}`}
        />
        <CardBody className="p-0">
          {isLoading && <Spinner label="Loading your schedule…" />}
          {!isLoading && error && (
            <ErrorState message={error.message} onRetry={refetch} />
          )}
          {!isLoading && !error && schedule.length === 0 && (
            <EmptyState
              icon={ClipboardList}
              title="No appointments on this day"
              description="This date is clear on your calendar. There are no booked patients for this selection."
            />
          )}
          {!isLoading && !error && schedule.length > 0 && (
            <ul className="divide-y divide-surface-border">
              {schedule.map((appt) => (
                <li key={appt.id}>
                  <Link
                    to={`/doctor/patients/${appt.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-16 shrink-0 font-mono text-sm text-ink-muted">
                        {formatTime(appt.startTime)}
                      </span>
                      <div>
                        <p className="font-medium text-ink">{appt.patientName}</p>
                        <p className="text-sm text-ink-muted">
                          {appt.reason || 'No reason provided'}
                        </p>
                        {appt.lastModifiedByName && (
                          <p className="text-xs text-ink-faint mt-0.5">
                            Last modified by {appt.lastModifiedByName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RecordTag id={appt.id} status={appt.status} />
                      <StatusBadge status={appt.status} />
                      <ChevronRight size={16} className="text-ink-faint" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}