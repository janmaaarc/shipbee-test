import { LogOut } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ChatWidget } from '../components/widget/ChatWidget'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function CustomerPage() {
  const { user, profile, loading, signOut, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">ShipBee Fulfillment</h1>
              <p className="text-xs text-text-muted">Global Shipping Solutions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm text-white">{profile?.full_name || 'Customer'}</p>
              <p className="text-xs text-text-muted">{profile?.email}</p>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero section */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-text-secondary text-base sm:text-lg mb-6">
            Ship in 5-10 days to any country. Save 20% on fulfillment costs.
            Get real-time tracking and quality inspection on every order.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">Start shipping today</Button>
            <Button variant="secondary" size="lg">Track my orders</Button>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            {
              title: 'Global Network',
              desc: '200+ fulfillment centers worldwide',
              icon: '🌍'
            },
            {
              title: 'Fast Shipping',
              desc: '5-10 days delivery to any country',
              icon: '🚀'
            },
            {
              title: '24/7 Support',
              desc: 'Real-time help when you need it',
              icon: '💬'
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-surface border border-border rounded-xl p-5 hover:border-white/20 transition-colors"
            >
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="text-base font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div className="bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Need help?</h3>
          <p className="text-text-secondary text-sm mb-4">
            Click the chat button in the bottom-right corner to contact our support team.
            We typically respond within a few hours.
          </p>
          <p className="text-xs text-text-muted">
            You can also attach images, videos, and documents to your messages.
          </p>
        </div>
      </main>

      {/* Chat widget - floating button */}
      <ChatWidget />
    </div>
  )
}
