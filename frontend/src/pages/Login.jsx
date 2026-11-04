import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function getErrorMessage(error) {
  return error.response?.data?.message || 'Unable to sign in. Please try again.'
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await login({ email: form.email.trim(), password: form.password })
      const destination = location.state?.from?.pathname || '/dashboard'
      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to StockFlow"
      subtitle="Manage your inventory with clarity and confidence."
      footer={<>New to StockFlow? <Link to="/register">Create an account</Link></>}
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <Field
          label="Email address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {error && <ErrorMessage message={error} />}
        <SubmitButton isSubmitting={isSubmitting} label="Sign in" />
      </form>
    </AuthShell>
  )
}

function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_1.05fr]">
        <section className="hidden bg-[#0b1f3a] px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <Link className="text-2xl font-bold tracking-tight" to="/">Stock<span className="text-blue-400">Flow</span></Link>
          <div className="max-w-md">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">Inventory, simplified</p>
            <h2 className="text-5xl font-semibold leading-tight">A clearer flow for every item.</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Keep your stock, team, and decisions moving in the right direction.</p>
          </div>
          <p className="text-sm text-slate-400">© 2026 StockFlow</p>
        </section>
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <Link className="mb-12 inline-block text-2xl font-bold tracking-tight text-[#0b1f3a] lg:hidden" to="/">Stock<span className="text-blue-600">Flow</span></Link>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f3a]">{title}</h1>
            <p className="mt-3 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-8 text-center text-sm text-slate-500">{footer}</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export function Field({ label, name, ...props }) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        required
        {...props}
      />
    </label>
  )
}

export function ErrorMessage({ message }) {
  return <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
}

export function SubmitButton({ isSubmitting, label }) {
  return (
    <button
      className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSubmitting}
      type="submit"
    >
      {isSubmitting ? 'Please wait...' : label}
    </button>
  )
}
