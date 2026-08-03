import { useState } from 'react'
import { Clock, CalendarSearch, UserPlus } from 'lucide-react'
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

  // Form fields
  const [patientName, setPatientName]   = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [doctorId, setDoctorId]         = useState('')
  const [date, setDate]                 = useState(todayISO())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isEmergency, setIsEmergency] = useState(false)
  const [emergencyReason, setEmergencyReason] = useState('')
  const [errors, setErrors]             = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load doctors list
  const { data: doctors } = useApi(
    () => appointmentService.getDoctors(),
    [],
  )

  // Load slots when doctor or date changes
  const {
    data: slots,
    isLoading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useApi(
    () => appointmentService.getAvailableSlots({ doctorId, date }),
    [doctorId, date],
    !!doctorId,
  )

  const validate = () => {
    const newErrors = {}
    if (!patientName.trim()) newErrors.patientName = 'Patient name is required'
    if (!patientPhone.trim()) newErrors.patientPhone = 'Phone number is required'
    if (!doctorId) newErrors.doctorId = 'Please select a doctor'
    if (!selectedSlot) newErrors.slot = 'Please select a time slot'
    if (!isEmergency) {
      const hoursUntil = (new Date(selectedSlot?.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
      if (selectedSlot && hoursUntil < 2) {
        newErrors.slot = 'Regular bookings must be at least 2 hours ahead. Mark as emergency to override.'
      }
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const result = await appointmentService.createWalkInAppointment({
        patientName:  patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorId,
        slotId: selectedSlot.id,
        isEmergency,
        emergencyReason: isEmergency ? emergencyReason.trim() : undefined,
      })
      showToast(
        `Walk-in booked for ${patientName} — reference #${result?.id?.slice(-6).toUpperCase() || 'N/A'}.`,
        'success',
      )
      // Reset form
      setPatientName('')
      setPatientPhone('')
      setSelectedSlot(null)
      setIsEmergency(false)
      setEmergencyReason('')
      refetchSlots()
    } catch (err) {
      showToast(
        err.message || 'Could not book this slot — it may already be taken.',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">
          Walk-in & emergency booking
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          For patients arriving without a prior online booking.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Patient details */}
        <Card>
          <CardHeader title="Patient details" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Patient name <span className="text-status-cancelled">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value)
                  if (errors.patientName) setErrors(p => ({ ...p, patientName: '' }))
                }}
                placeholder="Full name"
                className={`w-full rounded-card border bg-white px-3.5 py-2.5 text-sm
                  text-ink placeholder:text-ink-faint focus:border-primary-500
                  focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                    errors.patientName ? 'border-status-cancelled' : 'border-surface-border'
                  }`}
              />
              {errors.patientName && (
                <span className="mt-1 block text-xs text-status-cancelled">
                  {errors.patientName}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Phone number <span className="text-status-cancelled">*</span>
              </label>
              <input
                type="tel"
                value={patientPhone}
                onChange={(e) => {
                  setPatientPhone(e.target.value)
                  if (errors.patientPhone) setErrors(p => ({ ...p, patientPhone: '' }))
                }}
                placeholder="+254 7XX XXX XXX"
                className={`w-full rounded-card border bg-white px-3.5 py-2.5 text-sm
                  text-ink placeholder:text-ink-faint focus:border-primary-500
                  focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                    errors.patientPhone ? 'border-status-cancelled' : 'border-surface-border'
                  }`}
              />
              {errors.patientPhone && (
                <span className="mt-1 block text-xs text-status-cancelled">
                  {errors.patientPhone}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Doctor <span className="text-status-cancelled">*</span>
              </label>
              <Select
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value)
                  setSelectedSlot(null)
                  if (errors.doctorId) setErrors(p => ({ ...p, doctorId: '' }))
                }}
                invalid={!!errors.doctorId}
              >
                <option value="">Select a doctor</option>
                {(Array.isArray(doctors) ? doctors : []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
                  </option>
                ))}
              </Select>
              {errors.doctorId && (
                <span className="mt-1 block text-xs text-status-cancelled">
                  {errors.doctorId}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Date
              </label>
              <Input
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setSelectedSlot(null)
                }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Slot picker — only shows when a doctor is selected */}
        {doctorId && (
          <Card>
            <CardHeader
              title="Select a time slot"
              subtitle={selectedSlot ? `Selected: ${formatTime(selectedSlot.startTime)}` : 'Click a slot to select it'}
            />
            <CardBody>
              {slotsLoading && <Spinner label="Checking availability…" />}
              {!slotsLoading && slotsError && (
                <ErrorState message={slotsError.message} onRetry={refetchSlots} />
              )}
              {!slotsLoading && !slotsError && (Array.isArray(slots) ? slots : []).length === 0 && (
                <EmptyState
                  icon={CalendarSearch}
                  title="No open slots"
                  description="Try another date for this doctor."
                />
              )}
              {!slotsLoading && !slotsError && (Array.isArray(slots) ? slots : []).length > 0 && (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlot(slot)
                        if (errors.slot) setErrors(p => ({ ...p, slot: '' }))
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-card
                        border px-3 py-2.5 text-sm font-medium transition-colors ${
                          selectedSlot?.id === slot.id
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-surface-border bg-white text-ink hover:border-primary-400'
                        }`}
                    >
                      <Clock size={13} />
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
              {errors.slot && (
                <p className="mt-2 text-xs text-status-cancelled">{errors.slot}</p>
              )}
            </CardBody>
          </Card>
        )}

        {/* Submit */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => {
                setIsEmergency(e.target.checked)
                if (!e.target.checked) setEmergencyReason('')
                if (errors.slot) setErrors((p) => ({ ...p, slot: '' }))
              }}
            />
            Emergency booking (allow same-day / under 2 hours)
          </label>

          {isEmergency && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Emergency reason
              </label>
              <input
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="Reason for emergency override"
                className="w-full rounded-card border border-surface-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            {selectedSlot && (
              <p className="text-sm text-ink-muted">
                Booking for{' '}
                <span className="font-medium text-ink">
                  {formatTime(selectedSlot.startTime)}
                </span>{' '}
                on{' '}
                <span className="font-medium text-ink">{date}</span>
              </p>
            )}
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="ml-auto"
            >
              <UserPlus size={16} /> Book walk-in appointment
            </Button>
          </div>
        </div>

      </form>
    </div>
  )
}