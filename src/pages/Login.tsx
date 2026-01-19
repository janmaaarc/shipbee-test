import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, ArrowRight, Check, Headset } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { isValidEmail } from '../lib/utils'

export function Login() {
  const { user, loading, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Client-side email validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setSubmitting(true)

    const { error } = await signInWithEmail(email)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-brand-400/20 to-brand-600/20 rounded-2xl border border-brand-500/20 mb-4">
            <Headset className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">ShipBee Support</h1>
          <p className="text-text-secondary mt-2">Sign in to access your account</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/15 rounded-full mb-4">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">Check your email</h2>
              <p className="text-text-secondary text-sm">
                We sent a magic link to <span className="text-white">{email}</span>
              </p>
              <p className="text-text-muted text-sm mt-4">
                Click the link in the email to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-brand-400 text-sm mt-4 hover:text-brand-300"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  id="email"
                  type="email"
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  error={error}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={submitting}
              >
                <Mail className="w-4 h-4 mr-2" />
                Send magic link
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          No password needed. We'll send you a secure link.
        </p>
      </div>
    </div>
  )
}
