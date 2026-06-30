export function Card({ className = '', children, as: As = 'div', ...props }) {
  return (
    <As
      className={`rounded-card border border-surface-border bg-surface-card shadow-card ${className}`}
      {...props}
    >
      {children}
    </As>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-surface-border px-5 py-4 ${className}`}>
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}
