import { NavLink } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'

export function Sidebar({ navItems, roleLabel }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-surface-border bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-card bg-primary-700 text-white">
          <Stethoscope size={17} />
        </div>
        <div>
          <p className="font-display text-base font-semibold leading-none text-ink">MediBook</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-faint">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-muted hover:bg-surface hover:text-ink'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
