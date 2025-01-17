import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, Loader2 } from 'lucide-react'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const { error } = await signIn(email)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">SB</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">ShipBee Support</h1>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Check your email
              </h2>
              <p className="text-slate-600 mb-4">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-slate-500">
                Click the link in your email to sign in. No password needed.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-amber-600 hover:text-amber-700"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">
                Welcome
              </h2>
              <p className="text-slate-600 text-center mb-6">
                Sign in with your email to continue
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error || undefined}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Continue with Email'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-xs text-slate-500 text-center">
                We'll send you a magic link to sign in. No password required.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
