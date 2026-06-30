import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Field, Input } from '../../components/ui/Form'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      const user = await login(values)
      const fallback = `/${user.role}`
      navigate(location.state?.from?.pathname || fallback, { replace: true })
    } catch (err) {
      const message = err.message || 'Login failed. Check your credentials.'
      setServerError(message)
      showToast(message, 'error')
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Patients, doctors, and receptionists all sign in here.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-4">
        <Field label="Email" error={errors.email?.message} required>
          <Input
            type="email"
            placeholder="you@example.com"
            invalid={!!errors.email}
            {...register('email', { required: 'Email is required' })}
          />
        </Field>

        <Field label="Password" error={errors.password?.message} required>
          <Input
            type="password"
            placeholder="••••••••"
            invalid={!!errors.password}
            {...register('password', { required: 'Password is required' })}
          />
        </Field>

        {serverError && (
          <p role="alert" className="text-sm text-status-cancelled">
            {serverError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
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
