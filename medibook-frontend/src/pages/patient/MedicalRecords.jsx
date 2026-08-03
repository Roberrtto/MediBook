import { useState } from 'react'
import { FileText, Lock, Pill, FlaskConical, StickyNote } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { RecordTag } from '../../components/ui/Badge'
import { useApi } from '../../hooks/useApi'
import { recordService } from '../../api/recordService'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../utils/format'

export default function MedicalRecords() {
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState(null)

  const { data: records, isLoading, error, refetch } = useApi(
    () => recordService.getPatientRecords(user.id),
    [user.id],
  )

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useApi(() => recordService.getVisitDetail(selectedId), [selectedId], !!selectedId)

  const sorted = (records || []).sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Medical records</h2>
          <p className="mt-1 text-sm text-ink-muted">Read-only history of your visits, prescriptions, and lab results.</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-surface-border bg-white px-3 py-1.5 text-xs text-ink-muted sm:flex">
          <Lock size={12} /> AES-256 encrypted at rest
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader title="Visit history" />
          <CardBody className="p-0">
            {isLoading && <Spinner label="Loading records…" />}
            {!isLoading && error && <ErrorState message={error.message} onRetry={refetch} />}
            {!isLoading && !error && sorted.length === 0 && (
              <EmptyState icon={FileText} title="No records yet" description="Visit summaries will appear here after your first appointment." />
            )}
            {!isLoading && !error && sorted.length > 0 && (
              <ul className="max-h-[28rem] divide-y divide-surface-border overflow-y-auto scrollbar-thin">
                {sorted.map((rec) => (
                  <li key={rec.id}>
                    <button
                      onClick={() => setSelectedId(rec.id)}
                      className={`flex w-full flex-col items-start gap-1 px-5 py-3.5 text-left transition-colors hover:bg-surface ${
                        selectedId === rec.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <span className="text-sm font-medium text-ink">{rec.doctorName}</span>
                      <span className="text-xs text-ink-muted">{formatDate(rec.date)}</span>
                      <RecordTag id={rec.id} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Visit summary" subtitle={selectedId ? undefined : 'Select a visit to view details'} />
          <CardBody>
            {!selectedId && (
              <EmptyState icon={FileText} title="Nothing selected" description="Choose a visit from the list to see its diagnosis, prescription, and lab results." />
            )}
            {selectedId && detailLoading && <Spinner label="Decrypting record…" />}
            {selectedId && !detailLoading && detailError && <ErrorState message={detailError.message} />}
            {selectedId && !detailLoading && !detailError && detail && (
              <div className="flex flex-col gap-5">
                <Section icon={StickyNote} title="Diagnosis & notes" content={detail.diagnosis} />
                <Section icon={Pill} title="Prescription" content={detail.prescription} />
                <Section icon={FlaskConical} title="Lab results" content={detail.labResults} />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, content }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon size={15} className="text-primary-600" /> {title}
      </div>
      <p className="rounded-card bg-surface px-3.5 py-3 text-sm text-ink-muted">
        {content || 'Nothing recorded for this section.'}
      </p>
    </div>
  )
}
