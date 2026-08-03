import { Inbox, WifiOff, RotateCw } from 'lucide-react'
import { Button } from './Button'

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <Icon size={22} />
      </div>
      <h4 className="font-display text-base font-semibold text-ink">{title}</h4>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-status-cancelled/10 text-status-cancelled">
        <WifiOff size={22} />
      </div>
      <h4 className="font-display text-base font-semibold text-ink">Couldn't load this</h4>
      <p className="max-w-sm text-sm text-ink-muted">
        {message || 'The backend isn\u2019t reachable yet. This is expected until the API is connected.'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          <RotateCw size={14} /> Try again
        </Button>
      )}
    </div>
  )
}
