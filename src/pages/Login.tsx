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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105">
            <span className="text-white font-bold text-xl">SB</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">ShipBee Support</h1>
          <p className="text-slate-400 mt-1">Customer support portal</p>
        </div>

        <div className="bg-[#12121a] rounded-2xl border border-white/10 p-6 shadow-xl animate-fade-in animate-delay-100">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">
                Check your email
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                We sent a link to <span className="font-medium text-slate-200">{email}</span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                Use different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Sign in</h2>
              <p className="text-sm text-slate-400 mb-6">Enter your email to continue</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error || undefined}
                  required
                />

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              <p className="mt-4 text-xs text-slate-500 text-center">
                We'll email you a magic link to sign in
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
