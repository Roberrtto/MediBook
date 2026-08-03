import { useMemo } from 'react'
import { ShieldCheck, RefreshCw } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Spinner, ErrorState, EmptyState } from '../../components/ui/States'
import { useApi } from '../../hooks/useApi'
import { auditService } from '../../api/auditService'
import { formatDateTime } from '../../utils/format'

export default function AuditLog() {
  const { data, isLoading, error, refetch } = useApi(() => auditService.getAuditLogs({ limit: 100, offset: 0 }), [])

  const logs = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">Audit log</h2>
          <p className="mt-1 text-sm text-ink-muted">
            System activity for the IT administrator only.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-card border border-surface-border bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <Card>
        <CardHeader
          title="Recent activity"
          subtitle={`${logs.length} log entry${logs.length === 1 ? '' : 'ies'}`}
        />
        <CardBody className="p-0">
          {isLoading && <Spinner label="Loading audit log…" />}
          {!isLoading && error && <ErrorState message={error.message} onRetry={refetch} />}
          {!isLoading && !error && logs.length === 0 && (
            <EmptyState
              icon={ShieldCheck}
              title="No audit events yet"
              description="Activity will appear here as staff use the system."
            />
          )}

          {!isLoading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-surface-border text-left">
                <thead className="bg-surface">
                  <tr className="text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-5 py-3 font-medium">When</th>
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Resource</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-sm text-ink">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-5 py-3 whitespace-nowrap text-ink-muted">{formatDateTime(log.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-xs text-ink-faint">{log.userRole}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full border border-surface-border bg-surface px-2 py-1 text-xs font-medium text-ink">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{log.resource}</td>
                      <td className="px-5 py-3 text-ink-muted">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
