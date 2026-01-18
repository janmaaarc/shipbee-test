import { LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { ChatWidget } from '../components/widget/ChatWidget'
import { Button } from '../components/ui/Button'

export function WidgetDemo() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Demo page content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ShipBee Fulfillment</h1>
              <p className="text-text-secondary">Support Widget Demo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-white">{profile?.full_name || 'Customer'}</p>
              <p className="text-xs text-text-muted">{profile?.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hero section */}
        <div className="bg-surface border border-border rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            The modern way to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              fulfill orders
            </span>{' '}
            worldwide
          </h2>
          <p className="text-text-secondary text-lg mb-6">
            Ship in 5-10 days to any country. Save 20% on fulfillment costs.
            Get real-time tracking and quality inspection on every order.
          </p>
          <div className="flex gap-3">
            <Button size="lg">Start shipping today</Button>
            <Button variant="secondary" size="lg">Get a quote</Button>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Global Network', desc: '200+ fulfillment centers worldwide' },
            { title: 'Fast Shipping', desc: '5-10 days delivery to any country' },
            { title: '24/7 Support', desc: 'Real-time help when you need it' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-surface border border-border rounded-xl p-6 hover:border-white/20 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center">
          <p className="text-text-secondary">
            Click the chat button in the bottom-right corner to test the support widget.
          </p>
        </div>
      </div>

      {/* Chat widget */}
      <ChatWidget />
    </div>
  )
}
