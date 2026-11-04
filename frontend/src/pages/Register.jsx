import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ErrorMessage, Field, SubmitButton } from './Login'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      organizationName: form.organizationName.trim(),
    }

    if (!trimmedForm.name || !trimmedForm.email || !trimmedForm.password || !trimmedForm.organizationName) {
      setError('Complete all fields to create your account.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await api.post('/api/auth/register', trimmedForm)
      await login({ email: trimmedForm.email, password: trimmedForm.password })
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      const backendErrors = requestError.response?.data?.errors
      const fieldError = backendErrors && Object.values(backendErrors)[0]
      setError(fieldError || requestError.response?.data?.message || 'Unable to create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link className="text-2xl font-bold tracking-tight text-[#0b1f3a]" to="/">Stock<span className="text-blue-600">Flow</span></Link>
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Get started</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0b1f3a]">Create your account</h1>
          <p className="mt-3 text-slate-500">Start building a more reliable inventory workflow.</p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <Field label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Ada Lovelace" autoComplete="name" />
            <Field label="Email address" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" autoComplete="email" />
            <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" autoComplete="new-password" />
            <Field label="Organization name" name="organizationName" value={form.organizationName} onChange={handleChange} placeholder="Your company" autoComplete="organization" />
            {error && <ErrorMessage message={error} />}
            <SubmitButton isSubmitting={isSubmitting} label="Create account" />
          </form>
          <p className="mt-8 text-center text-sm text-slate-500">Already have an account? <Link className="font-semibold text-blue-600 hover:text-blue-700" to="/login">Sign in</Link></p>
        </div>
      </div>
    </main>
  )
}
