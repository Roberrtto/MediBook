import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { UserPlus, Clock, CalendarSearch } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Form'
import { Button } from '../../components/ui/Button'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { useToast } from '../../context/ToastContext'
import { formatTime, todayISO } from '../../utils/format'

export default function WalkInBooking() {
  const { showToast } = useToast()
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: doctors } = useApi(() => appointmentService.getDoctors(), [])

  const {
    data: slots,
    isLoading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useApi(() => appointmentService.getAvailableSlots({ doctorId, date }), [doctorId, date], !!doctorId)

  const onSubmit = async (values) => {
    setIsSubmitting(true)
    try {
      const result = await appointmentService.createWalkInAppointment({
        patientName: values.patientName,
        patientPhone: values.patientPhone,
        doctorId,
        slotId: selectedSlot.id,
      })
      showToast(`Walk-in booked for ${values.patientName} — reference #${result.id}.`, 'success')
      reset()
      setSelectedSlot(null)
      refetchSlots()
    } catch (err) {
      showToast(err.message || 'Could not book this slot — it may already be taken.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Walk-in & emergency booking</h2>
        <p className="mt-1 text-sm text-ink-muted">For patients arriving without a prior online booking.</p>
      </div>

      <Card>
        <CardHeader title="Patient details" />
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Patient name" error={errors.patientName?.message} required>
              <Input
                placeholder="Full name"
                invalid={!!errors.patientName}
                {...register('patientName', { required: 'Patient name is required' })}
              />
            </Field>
            <Field label="Phone number" error={errors.patientPhone?.message} required>
              <Input
                placeholder="+254 7XX XXX XXX"
                invalid={!!errors.patientPhone}
                {...register('patientPhone', { required: 'Phone number is required' })}
              />
            </Field>
            <Field label="Doctor" required>
              <Select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setSelectedSlot(null) }}>
                <option value="">Select a doctor</option>
                {(doctors || []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" min={todayISO()} value={date} onChange={(e) => { setDate(e.target.value); setSelectedSlot(null) }} />
            </Field>
          </CardBody>

          {doctorId && (
            <CardBody className="border-t border-surface-border">
              <p className="mb-3 text-sm font-medium text-ink">Available slots</p>
              {slotsLoading && <Spinner label="Checking availability…" />}
              {!slotsLoading && slotsError && <ErrorState message={slotsError.message} onRetry={refetchSlots} />}
              {!slotsLoading && !slotsError && (slots || []).length === 0 && (
                <EmptyState icon={CalendarSearch} title="No open slots" description="Try another date for this doctor." />
              )}
              {!slotsLoading && !slotsError && (slots || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-center gap-1.5 rounded-card border px-3 py-2.5 text-sm font-medium transition-colors ${
                        selectedSlot?.id === slot.id
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-surface-border bg-white text-ink hover:border-primary-400'
                      }`}
                    >
                      <Clock size={13} /> {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          )}

          <CardBody className="flex justify-end border-t border-surface-border">
            <Button type="submit" disabled={!selectedSlot} isLoading={isSubmitting}>
              <UserPlus size={16} /> Book walk-in appointment
            </Button>
          </CardBody>
        </form>
      </Card>
    </div>
  )
}
