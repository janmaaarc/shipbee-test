import { useState } from 'react'
import { Mail, ArrowRight, Check, HelpCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'

export function WidgetLogin() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-2xl mb-3 border border-amber-500/20">
            <HelpCircle className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Support</h2>
          <p className="text-sm text-text-secondary mt-1">Sign in to get help</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/15 rounded-full mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white mb-2">Check your email</p>
            <p className="text-sm text-text-secondary">
              We sent a link to <span className="text-white">{email}</span>
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-amber-400 text-sm mt-4 hover:text-amber-300 transition-colors"
            >
              Use different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error}
              aria-label="Email address"
            />
            <Button
              type="submit"
              className="w-full"
              loading={submitting}
            >
              <Mail className="w-4 h-4 mr-2" />
              Send magic link
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
