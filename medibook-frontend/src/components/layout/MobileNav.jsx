import { NavLink } from 'react-router-dom'
import { Stethoscope, X } from 'lucide-react'

export function MobileNav({ navItems, roleLabel, isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex h-full w-72 flex-col bg-white shadow-popover">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-card bg-primary-700 text-white">
              <Stethoscope size={17} />
            </div>
            <div>
              <p className="font-display text-base font-semibold leading-none text-ink">MediBook</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ink-faint">{roleLabel}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="text-ink-faint hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-card px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-muted hover:bg-surface hover:text-ink'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
