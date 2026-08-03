import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

export default function Unauthorized() {
  const { user } = useAuth()

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-surface px-4 text-center">
      <ShieldAlert size={28} className="text-status-cancelled" />
      <h1 className="font-display text-2xl font-semibold text-ink">Access restricted</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        Your account role doesn't have permission to view that page. This boundary is enforced by RBAC (NFR-01).
      </p>
      <Link to={user ? `/${user.role}` : '/login'}>
        <Button variant="outline" className="mt-2">
          Back to my dashboard
        </Button>
      </Link>
    </div>
  )
}
