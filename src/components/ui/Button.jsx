const VARIANTS = {
  primary: 'bg-accent-500 text-white hover:bg-accent-600 disabled:bg-accent-200',
  secondary: 'bg-primary-700 text-white hover:bg-primary-800 disabled:bg-primary-200',
  outline: 'border border-surface-border bg-white text-ink hover:bg-surface disabled:text-ink-faint',
  ghost: 'text-primary-700 hover:bg-primary-50 disabled:text-ink-faint',
  danger: 'bg-status-cancelled text-white hover:bg-status-cancelled/90 disabled:bg-status-cancelled/30',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-card font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  )
}
