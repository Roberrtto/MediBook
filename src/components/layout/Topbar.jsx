import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-white px-4 py-4 md:px-7">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="-ml-1 rounded-card p-1.5 text-ink-muted hover:bg-surface md:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-none text-ink">{user?.name}</p>
          <p className="mt-1 text-xs text-ink-faint capitalize">{user?.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 font-display text-sm font-semibold text-primary-700">
          {user?.name?.[0] ?? '?'}
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          title="Log out"
          className="rounded-card p-2 text-ink-muted hover:bg-surface hover:text-status-cancelled"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
