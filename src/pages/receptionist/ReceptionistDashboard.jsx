import { useState } from 'react'
import { CalendarRange, CalendarX2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Form'
import { Button } from '../../components/ui/Button'
import { StatusBadge, RecordTag } from '../../components/ui/Badge'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { Modal } from '../../components/ui/Modal'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { useToast } from '../../context/ToastContext'
import { formatTime, todayISO } from '../../utils/format'

export default function ReceptionistDashboard() {
  const [date, setDate] = useState(todayISO())
  const [doctorId, setDoctorId] = useState('')
  const [cancelTarget, setCancelTarget] = useState(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const { showToast } = useToast()

  const { data: doctors } = useApi(() => appointmentService.getDoctors(), [])

  const { data, isLoading, error, refetch } = useApi(
    () => appointmentService.getClinicSchedule({ date, doctorId }),
    [date, doctorId],
  )

  const appointments = (data || []).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  const loadByDoctor = (doctors || []).map((d) => ({
    name: d.name.replace('Dr. ', ''),
    appointments: appointments.filter((a) => a.doctorId === d.id).length,
  }))

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await appointmentService.cancelAppointment(cancelTarget.id)
      showToast('Appointment cancelled and slot released.', 'success')
      setCancelTarget(null)
      refetch()
    } catch (err) {
      showToast(err.message || 'Could not cancel this appointment.', 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Clinic calendar</h2>
        <p className="mt-1 text-sm text-ink-muted">All appointments across every doctor, in one place.</p>
      </div>

      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Doctor">
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">All doctors</option>
              {(doctors || []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {!isLoading && !error && (doctors || []).length > 0 && (
        <Card>
          <CardHeader title="Load by doctor" subtitle={date} />
          <CardBody>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loadByDoctor}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE7E3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#54635F' }} axisLine={{ stroke: '#DCE7E3' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#54635F' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F4F8F6' }} contentStyle={{ borderRadius: 10, borderColor: '#DCE7E3', fontSize: 13 }} />
                  <Bar dataKey="appointments" fill="#267A76" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Today's allocations" subtitle={`${appointments.length} appointment${appointments.length === 1 ? '' : 's'}`} />
        <CardBody className="p-0">
          {isLoading && <Spinner label="Loading the calendar…" />}
          {!isLoading && error && <ErrorState message={error.message} onRetry={refetch} />}
          {!isLoading && !error && appointments.length === 0 && (
            <EmptyState icon={CalendarRange} title="Nothing scheduled" description="No appointments match this date and doctor filter." />
          )}
          {!isLoading && !error && appointments.length > 0 && (
            <ul className="divide-y divide-surface-border">
              {appointments.map((appt) => (
                <li key={appt.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="w-16 shrink-0 font-mono text-sm text-ink-muted">{formatTime(appt.startTime)}</span>
                    <div>
                      <p className="font-medium text-ink">{appt.patientName}</p>
                      <p className="text-sm text-ink-muted">{appt.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RecordTag id={appt.id} status={appt.status} />
                    <StatusBadge status={appt.status} />
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <Button variant="outline" size="sm" onClick={() => setCancelTarget(appt)}>
                        <CalendarX2 size={14} /> Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
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
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Back</Button>
            <Button variant="danger" isLoading={isCancelling} onClick={handleCancel}>Yes, cancel</Button>
          </>
        }
      >
        {cancelTarget && (
          <p className="text-sm text-ink-muted">
            This frees up <span className="font-medium text-ink">{cancelTarget.doctorName}</span>'s slot at{' '}
            <span className="font-medium text-ink">{formatTime(cancelTarget.startTime)}</span> for{' '}
            <span className="font-medium text-ink">{cancelTarget.patientName}</span>.
          </p>
        )}
      </Modal>
    </div>
  )
}
