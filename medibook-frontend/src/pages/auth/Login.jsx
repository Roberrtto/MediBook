import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors]     = useState({})
  const [isLoading, setIsLoading]   = useState(false)
  const [serverError, setServerError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    const newErrors = {}
    if (!email.trim())    newErrors.email    = 'Email is required'
    if (!password.trim()) newErrors.password = 'Password is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const user = await login({ email: email.trim(), password })
      const normalizedRole = user.role.toLowerCase()
      const dashboard = `/${normalizedRole === 'admin' ? 'admin' : normalizedRole}`
      const requestedPath = location.state?.from?.pathname
      const requestedRole = requestedPath?.split('/')[1]
      const destination =
        requestedPath &&
        requestedRole &&
        ['patient', 'doctor', 'receptionist', 'admin'].includes(requestedRole) &&
        requestedRole === normalizedRole
          ? requestedPath
          : dashboard

      navigate(destination, { replace: true })
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.'
      setServerError(message)
      showToast(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full rounded-card border bg-white px-3.5 py-2.5 text-sm text-ink 
     placeholder:text-ink-faint focus:border-primary-500 focus:outline-none 
     focus:ring-1 focus:ring-primary-500 ${
      errors[field] ? 'border-status-cancelled' : 'border-surface-border'
    }`

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Patients, doctors, and receptionists all sign in here.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Email <span className="text-status-cancelled">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors(p => ({ ...p, email: '' }))
            }}
            placeholder="you@example.com"
            className={inputClass('email')}
          />
          {errors.email && (
            <span className="mt-1 block text-xs text-status-cancelled">{errors.email}</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Password <span className="text-status-cancelled">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors(p => ({ ...p, password: '' }))
            }}
            placeholder="••••••••"
            className={inputClass('password')}
          />
          {errors.password && (
            <span className="mt-1 block text-xs text-status-cancelled">{errors.password}</span>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-sm text-status-cancelled">{serverError}</p>
        )}

        <Button type="submit" isLoading={isLoading} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New patient?{' '}
        <Link to="/register" className="font-medium text-primary-700 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}