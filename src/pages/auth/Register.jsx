import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { Field, Input } from '../../components/ui/Form'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function Register() {
  const { register: signup } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (values) => {
    setServerError(null)
    try {
      await signup({ name: values.name, email: values.email, password: values.password, role: 'patient' })
      navigate('/patient', { replace: true })
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.'
      setServerError(message)
      showToast(message, 'error')
    }
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        For patients booking appointments. Clinic staff accounts are set up by an administrator.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-4">
        <Field label="Full name" error={errors.name?.message} required>
          <Input placeholder="Jane Wanjiru" invalid={!!errors.name} {...register('name', { required: 'Name is required' })} />
        </Field>

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
            placeholder="At least 8 characters"
            invalid={!!errors.password}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Use at least 8 characters' },
            })}
          />
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword?.message} required>
          <Input
            type="password"
            placeholder="Re-enter your password"
            invalid={!!errors.confirmPassword}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
        </Field>

        {serverError && (
          <p role="alert" className="text-sm text-status-cancelled">
            {serverError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-primary-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
