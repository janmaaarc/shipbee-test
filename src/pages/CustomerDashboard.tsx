import { useState } from 'react'
import { LogOut, Menu, X, Headset, Inbox, MessageSquare, Plus } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTickets, useTicketDetails } from '../hooks/useTickets'
import { useCustomerStats } from '../hooks/useCustomerStats'
import { CustomerStatsCards } from '../components/customer/CustomerStatsCards'
import { CustomerTicketList } from '../components/customer/CustomerTicketList'
import { CustomerTicketDetail } from '../components/customer/CustomerTicketDetail'
import { NewTicketForm } from '../components/widget/NewTicketForm'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/Button'

export function CustomerDashboard() {
  const { user, profile, loading: authLoading, signOut, isAdmin } = useAuth()
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)

  const { tickets, loading: ticketsLoading, loadingMore, hasMore, loadMore, refetch, error: ticketsError } = useTickets()
  const { stats, loading: statsLoading } = useCustomerStats(tickets, ticketsLoading)

  const {
    ticket: selectedTicket,
    loading: ticketLoading,
    sendMessage,
  } = useTicketDetails(selectedTicketId, {
    profile,
    onMarkAsRead: refetch,
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  function handleTicketCreated(ticketId: string) {
    setShowNewTicket(false)
    setSelectedTicketId(ticketId)
    setMobileMenuOpen(false)
    refetch()
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-14 sm:h-16 bg-surface border-b border-border px-3 sm:px-4 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-1 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Open ticket list"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex w-10 h-10 bg-gradient-to-br from-brand-400/20 to-brand-600/20 rounded-xl items-center justify-center border border-brand-500/20">
            <Headset className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-white">ShipBee Support</h1>
            <p className="hidden sm:block text-xs text-text-muted">Your Support Tickets</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-white">{profile?.full_name || 'Customer'}</p>
            <p className="text-xs text-text-muted">{profile?.email}</p>
          </div>
          <ThemeToggle className="hidden sm:flex" />
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Ticket list */}
        <aside
          className={`${
            mobileMenuOpen ? 'fixed inset-0 z-40 bg-background' : 'hidden'
          } lg:relative lg:block lg:w-96 xl:w-[420px] border-r border-border flex flex-col`}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-border safe-area-inset-top">
            <h2 className="font-semibold text-white">Your Tickets</h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Stats */}
            <div className="p-3 sm:p-4 border-b border-border">
              <CustomerStatsCards stats={stats} loading={statsLoading} />
            </div>

            {/* New Ticket Button */}
            <div className="p-3 sm:p-4 border-b border-border">
              <Button onClick={() => setShowNewTicket(true)} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Support Ticket
              </Button>
            </div>

            {/* Ticket list */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <CustomerTicketList
                tickets={tickets}
                selectedId={selectedTicketId}
                onSelect={(id) => {
                  setSelectedTicketId(id)
                  setMobileMenuOpen(false)
                }}
                loading={ticketsLoading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                error={ticketsError}
                onRetry={refetch}
              />
            </div>

            {/* Sidebar footer */}
            <div className="hidden sm:flex items-center justify-center p-3 border-t border-border safe-area-inset-bottom">
              <span className="text-xs text-text-muted">Powered by ShipBee Support</span>
            </div>
          </div>
        </aside>

        {/* Ticket detail or New Ticket Form - Desktop */}
        <main className="flex-1 hidden lg:flex flex-col">
          {showNewTicket ? (
            <div className="h-full flex flex-col bg-surface">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">New Support Ticket</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowNewTicket(false)}>
                  Cancel
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NewTicketForm
                  onSuccess={handleTicketCreated}
                  onCancel={() => setShowNewTicket(false)}
                />
              </div>
            </div>
          ) : selectedTicketId ? (
            <CustomerTicketDetail
              ticket={selectedTicket}
              loading={ticketLoading}
              onClose={() => setSelectedTicketId(null)}
              onSendMessage={sendMessage}
              profile={profile}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No ticket selected</h3>
              <p className="text-sm text-text-secondary max-w-xs mb-4">
                Select a ticket from the list to view the conversation
              </p>
              <Button onClick={() => setShowNewTicket(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create New Ticket
              </Button>
            </div>
          )}
        </main>

        {/* Ticket detail or New Ticket - Mobile (full screen overlay) */}
        {(selectedTicketId || showNewTicket) && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background animate-in slide-in-from-right-4 fade-in duration-200 flex flex-col">
            {showNewTicket ? (
              <div className="h-full flex flex-col bg-surface">
                <div className="p-4 border-b border-border flex items-center justify-between safe-area-inset-top">
                  <h2 className="text-lg font-semibold text-white">New Support Ticket</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewTicket(false)}>
                    Cancel
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NewTicketForm
                    onSuccess={handleTicketCreated}
                    onCancel={() => setShowNewTicket(false)}
                  />
                </div>
              </div>
            ) : (
              <CustomerTicketDetail
                ticket={selectedTicket}
                loading={ticketLoading}
                onClose={() => setSelectedTicketId(null)}
                onSendMessage={sendMessage}
                profile={profile}
              />
            )}
          </div>
        )}

        {/* Mobile welcome screen when no ticket selected */}
        {!selectedTicketId && !mobileMenuOpen && !showNewTicket && (
          <div className="lg:hidden flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface-light flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!</h3>
            <p className="text-sm text-text-secondary mb-4">
              View your support tickets or create a new one
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="px-4 py-2 bg-surface-light text-white text-sm font-medium rounded-lg active:scale-95 transition-transform"
              >
                View Tickets
              </button>
              <button
                onClick={() => setShowNewTicket(true)}
                className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg active:scale-95 transition-transform"
              >
                New Ticket
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
