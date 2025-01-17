import { useAuth } from '@/contexts/AuthContext'
import { ChatWidget } from '@/components/widget/ChatWidget'
import { Button } from '@/components/ui/Button'
import { LogOut } from 'lucide-react'

export function WidgetDemo() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Demo header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Widget Demo</h1>
            <p className="text-sm text-slate-500">
              This page demonstrates the embeddable support widget
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Logged in as: {profile?.full_name || profile?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Demo content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Welcome to Your Dashboard
          </h2>
          <p className="text-slate-600 mb-6">
            This is a demo page showing how the ShipBee Support widget would appear
            on your website. The chat widget is floating in the bottom-right corner.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">Quick Start</h3>
              <p className="text-sm text-slate-600">
                Click the chat button in the bottom right to start a conversation
                with our support team.
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">Attach Files</h3>
              <p className="text-sm text-slate-600">
                You can attach images, videos, and documents to help explain
                your issue.
              </p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl">
              <h3 className="font-semibold text-slate-900 mb-2">Real-time Updates</h3>
              <p className="text-sm text-slate-600">
                Messages appear instantly. No need to refresh to see new replies.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">Try it out!</h3>
            <p className="text-sm text-amber-700">
              Click the amber chat button in the bottom-right corner to open the
              support widget and create a test ticket.
            </p>
          </div>
        </div>
      </main>

      {/* The widget */}
      <ChatWidget />
    </div>
  )
}
