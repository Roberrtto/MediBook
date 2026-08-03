import { forwardRef } from 'react'

export function Field({ label, error, hint, children, required, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-status-cancelled"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-status-cancelled">{error}</span>}
    </label>
  )
}

export const Input = forwardRef(function Input({ className = '', invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-card border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
        invalid ? 'border-status-cancelled' : 'border-surface-border'
      } ${className}`}
      {...props}
    />
  )
})

export const Select = forwardRef(function Select({ className = '', invalid, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-card border bg-white px-3.5 py-2.5 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
        invalid ? 'border-status-cancelled' : 'border-surface-border'
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  )
})

export const Textarea = forwardRef(function Textarea({ className = '', invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-card border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
        invalid ? 'border-status-cancelled' : 'border-surface-border'
      } ${className}`}
      {...props}
    />
  )
})
