import { Link } from 'react-router-dom'
import { CompassIcon } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-surface px-4 text-center">
      <CompassIcon size={28} className="text-primary-600" />
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/">
        <Button variant="outline" className="mt-2">
          Back to MediBook
        </Button>
      </Link>
    </div>
  )
}
