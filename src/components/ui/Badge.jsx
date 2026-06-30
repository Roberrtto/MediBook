const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', dot: 'bg-status-confirmed', text: 'text-status-confirmed' },
  scheduled: { label: 'Scheduled', dot: 'bg-status-confirmed', text: 'text-status-confirmed' },
  pending: { label: 'Pending', dot: 'bg-status-pending', text: 'text-status-pending' },
  cancelled: { label: 'Cancelled', dot: 'bg-status-cancelled', text: 'text-status-cancelled' },
  completed: { label: 'Completed', dot: 'bg-status-completed', text: 'text-status-completed' },
}

/** Small status pill with a colored dot — used wherever an appointment/record state appears. */
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-2.5 py-1 text-xs font-medium ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

/**
 * Monospace record/appointment ID tag — the deck's recurring "unique ID" and
 * "immutable audit log" language (FR-03, NFR-02) made visible as a chart-tab motif.
 */
export function RecordTag({ id, status }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-surface-border bg-surface px-2 py-1 font-mono text-xs text-ink-muted">
      {cfg && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      #{id}
    </span>
  )
}
