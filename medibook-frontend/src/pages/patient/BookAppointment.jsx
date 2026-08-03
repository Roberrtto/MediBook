import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CalendarSearch, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Select, Input, Textarea } from '../../components/ui/Form'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { SPECIALTIES } from '../../config/nav'
import { formatTime, todayISO } from '../../utils/format'

export default function BookAppointment() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [specialty, setSpecialty] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isBooking, setIsBooking] = useState(false)

  const { register, handleSubmit, reset } = useForm()

  const { data: doctors } = useApi(() => appointmentService.getDoctors(), [])

  const filteredDoctors = useMemo(
    () => (doctors || []).filter((d) => !specialty || d.specialty === specialty),
    [doctors, specialty],
  )

  const {
    data: slots,
    isLoading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useApi(
    () => appointmentService.getAvailableSlots({ doctorId, specialty, date }),
    [doctorId, specialty, date],
    true,
  )

  const openConfirm = (slot) => {
    setSelectedSlot(slot)
    reset({ reason: '' })
  }

  const onConfirm = async ({ reason }) => {
    setIsBooking(true)
    try {
      const result = await appointmentService.bookAppointment({
        doctorId: selectedSlot.doctorId,
        slotId: selectedSlot.id,
        patientId: user.id,
        notes: reason,
      })
      showToast(`Appointment confirmed — reference #${result.id}.`, 'success')
      setSelectedSlot(null)
      refetchSlots()
    } catch (err) {
      // FR-12: a 409 here means the database transaction lock caught a clash.
      showToast(err.message || 'That slot was just taken. Please pick another time.', 'error')
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Book an appointment</h2>
        <p className="mt-1 text-sm text-ink-muted">Filter by specialty and doctor to see real-time availability.</p>
      </div>

      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Specialty">
            <Select value={specialty} onChange={(e) => { setSpecialty(e.target.value); setDoctorId('') }}>
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </Field>

          <Field label="Doctor">
            <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Any available doctor</option>
              {filteredDoctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Date">
            <Input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Available time slots" subtitle={date} />
        <CardBody>
          {slotsLoading && <Spinner label="Checking real-time availability…" />}
          {!slotsLoading && slotsError && <ErrorState message={slotsError.message} onRetry={refetchSlots} />}
          {!slotsLoading && !slotsError && (slots || []).length === 0 && (
            <EmptyState
              icon={CalendarSearch}
              title="No open slots for this filter"
              description="Try a different date, doctor, or specialty."
            />
          )}
          {!slotsLoading && !slotsError && (slots || []).length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => openConfirm(slot)}
                  className="flex flex-col items-start gap-1 rounded-card border border-surface-border bg-white px-3.5 py-3 text-left transition-colors hover:border-primary-400 hover:bg-primary-50"
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    <Clock size={14} className="text-primary-600" /> {formatTime(slot.startTime)}
                  </span>
                  <span className="text-xs text-ink-muted">{slot.doctorName}</span>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={!!selectedSlot}
        onClose={() => setSelectedSlot(null)}
        title="Confirm appointment"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedSlot(null)}>Cancel</Button>
            <Button onClick={handleSubmit(onConfirm)} isLoading={isBooking}>
              <CheckCircle2 size={16} /> Confirm booking
            </Button>
          </>
        }
      >
        {selectedSlot && (
          <div className="flex flex-col gap-4">
            <div className="rounded-card bg-surface px-4 py-3 text-sm">
              <p className="font-medium text-ink">{selectedSlot.doctorName}</p>
              <p className="mt-0.5 text-ink-muted">{formatTime(selectedSlot.startTime)} · {date}</p>
            </div>
            <Field label="Reason for visit (optional)">
              <Textarea rows={3} placeholder="Briefly describe your symptoms or reason" {...register('reason')} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
