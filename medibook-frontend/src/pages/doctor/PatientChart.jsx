import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, FileText, StickyNote, Pill, FlaskConical, Save } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Field, Textarea } from '../../components/ui/Form'
import { Button } from '../../components/ui/Button'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { appointmentService } from '../../api/appointmentService'
import { recordService } from '../../api/recordService'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatDateTime } from '../../utils/format'

export default function PatientChart() {
  const { appointmentId } = useParams()
  const { showToast } = useToast()

  const { data: appt, isLoading: apptLoading, error: apptError } = useApi(
    () => appointmentService.getAppointmentById(appointmentId),
    [appointmentId],
  )

  const {
    data: records,
    isLoading: recordsLoading,
    error: recordsError,
  } = useApi(() => recordService.getPatientRecords(appt.patientId), [appt?.patientId], !!appt?.patientId)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm()

  const onSubmit = async (values) => {
    try {
      await recordService.addClinicalNote(appointmentId, values)
      showToast('Clinical note saved to the patient\u2019s file.', 'success')
      reset()
    } catch (err) {
      showToast(err.message || 'Could not save this note. Please try again.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/doctor" className="flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={15} /> Back to schedule
      </Link>

      {apptLoading && <Spinner label="Loading patient details…" />}
      {!apptLoading && apptError && <ErrorState message={apptError.message} />}

      {!apptLoading && !apptError && appt && (
        <>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">{appt.patientName}</h2>
            <p className="mt-1 text-sm text-ink-muted">Appointment at {formatDateTime(appt.startTime)}</p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Past visit history" subtitle="Read-only" />
              <CardBody className="p-0">
                {recordsLoading && <Spinner label="Loading history…" />}
                {!recordsLoading && recordsError && <ErrorState message={recordsError.message} />}
                {!recordsLoading && !recordsError && (records || []).length === 0 && (
                  <EmptyState icon={FileText} title="No prior visits on file" />
                )}
                {!recordsLoading && !recordsError && (records || []).length > 0 && (
                  <ul className="max-h-96 divide-y divide-surface-border overflow-y-auto scrollbar-thin">
                    {records.map((rec) => (
                      <li key={rec.id} className="px-5 py-3.5">
                        <p className="text-sm font-medium text-ink">{formatDate(rec.date)}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{rec.diagnosis || 'No diagnosis recorded'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Add clinical note" subtitle="FR-09 · Attached to this visit only" />
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardBody className="flex flex-col gap-4">
                  <Field label="Diagnosis">
                    <Textarea rows={2} placeholder="Clinical findings and diagnosis" {...register('diagnosis')} />
                  </Field>
                  <Field label="Prescription">
                    <Textarea rows={2} placeholder="Medication, dosage, instructions" {...register('prescription')} />
                  </Field>
                  <Field label="Lab orders">
                    <Textarea rows={2} placeholder="Tests to order, if any" {...register('labOrders')} />
                  </Field>
                  <Field label="Private note">
                    <Textarea rows={2} placeholder="Internal note, not shown to the patient" {...register('note')} />
                  </Field>
                </CardBody>
                <CardBody className="flex justify-end border-t border-surface-border">
                  <Button type="submit" isLoading={isSubmitting}>
                    <Save size={15} /> Save to patient file
                  </Button>
                </CardBody>
              </form>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
