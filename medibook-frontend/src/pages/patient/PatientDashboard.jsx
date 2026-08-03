import { CalendarPlus, CalendarCheck, FileText, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { StatusBadge, RecordTag } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { formatDateTime } from '../../utils/format'

const QUICK_ACTIONS = [
  { to: '/patient/book', label: 'Book appointment', icon: CalendarPlus },
  { to: '/patient/appointments', label: 'My appointments', icon: CalendarCheck },
  { to: '/patient/records', label: 'Medical records', icon: FileText },
]

export default function PatientDashboard() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useApi(
    () => appointmentService.getMyAppointments(user.id),
    [user.id],
  )

  const upcoming = (Array.isArray(data) ? data : [])
    .filter((a) => a.status !== 'cancelled' && new Date(a.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Welcome, {user?.name?.split(' ')[0]}</h2>
        <p className="mt-1 text-sm text-ink-muted">Here's what's coming up for your care.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center gap-3.5 px-5 py-4 transition-shadow hover:shadow-popover">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary-50 text-primary-700">
                <Icon size={19} />
              </span>
              <span className="font-medium text-ink">{label}</span>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Upcoming appointments"
          subtitle="Your next confirmed visits"
          action={
            <Link to="/patient/appointments">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          }
        />
        <CardBody className="p-0">
          {isLoading && <Spinner label="Loading your appointments…" />}
          {!isLoading && error && <ErrorState message={error.message} onRetry={refetch} />}
          {!isLoading && !error && upcoming.length === 0 && (
            <EmptyState
              icon={Clock3}
              title="No upcoming appointments"
              description="When you book a visit, it'll show up here with the date, time, and doctor."
              action={
                <Link to="/patient/book">
                  <Button size="sm">Book an appointment</Button>
                </Link>
              }
            />
          )}
          {!isLoading && !error && upcoming.length > 0 && (
            <ul className="divide-y divide-surface-border">
              {upcoming.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-medium text-ink">{appt.doctorName}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{formatDateTime(appt.startTime)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RecordTag id={appt.id} status={appt.status} />
                    <StatusBadge status={appt.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
