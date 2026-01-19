import { useState, useRef } from 'react'
import { LogOut, Menu, X, Headset, Inbox, MessageSquare, Keyboard } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTickets, useTicketDetails } from '../hooks/useTickets'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts'
import { StatsCards } from '../components/admin/StatsCards'
import { Filters } from '../components/admin/Filters'
import { TicketList } from '../components/admin/TicketList'
import { TicketDetail } from '../components/admin/TicketDetail'
import { KeyboardShortcutsModal } from '../components/ui/KeyboardShortcutsModal'
import { SoundToggle } from '../components/ui/SoundToggle'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { Button } from '../components/ui/Button'
import type { TicketStatus, TicketPriority } from '../types/database'

export function AdminDashboard() {
  const { user, profile, loading: authLoading, signOut, isAdmin } = useAuth()
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus[]>([])
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Global keyboard shortcuts
  const { showShortcutsModal, setShowShortcutsModal } = useGlobalShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    enabled: true,
  })

  // Debounce search to avoid excessive API calls
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  const { tickets, loading: ticketsLoading, loadingMore, hasMore, loadMore, refetch, error: ticketsError } = useTickets({
    searchTerm: debouncedSearchTerm,
    statusFilter: statusFilter.length > 0 ? statusFilter : undefined,
    priorityFilter: priorityFilter.length > 0 ? priorityFilter : undefined,
  })

  const {
    ticket: selectedTicket,
    loading: ticketLoading,
    updateStatus,
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

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 h-14 sm:h-16 bg-surface border-b border-border px-3 sm:px-4 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile menu button - in header */}
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
            <p className="hidden sm:block text-xs text-text-muted">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm text-white">{profile?.full_name || 'Admin'}</p>
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
          } lg:relative lg:flex lg:flex-col lg:h-full lg:w-96 xl:w-[420px] border-r border-border`}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-border safe-area-inset-top">
            <h2 className="font-semibold text-white">Tickets</h2>
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
              <StatsCards />
            </div>

            {/* Filters */}
            <div className="p-3 sm:p-4 border-b border-border">
              <Filters
                ref={searchInputRef}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
              />
            </div>

            {/* Ticket list */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              <TicketList
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

            {/* Sidebar footer with Sound & Keyboard shortcuts */}
            <div className="hidden sm:flex items-center justify-between p-3 border-t border-border safe-area-inset-bottom">
              <div className="flex items-center gap-1">
                <SoundToggle />
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="p-2 text-text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  aria-label="Keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>
              <span className="text-xs text-text-muted">Powered by ShipBee</span>
            </div>
          </div>
        </aside>

        {/* Ticket detail - Desktop */}
        <main className="flex-1 hidden lg:flex flex-col">
          {selectedTicketId ? (
            <TicketDetail
              ticket={selectedTicket}
              loading={ticketLoading}
              onClose={() => setSelectedTicketId(null)}
              onStatusChange={updateStatus}
              onSendMessage={sendMessage}
              profile={profile}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
                <Inbox className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">No ticket selected</h3>
              <p className="text-sm text-text-secondary max-w-xs">
                Select a ticket from the list to view details and respond to customers
              </p>
            </div>
          )}
        </main>

        {/* Ticket detail - Mobile (full screen overlay) */}
        {selectedTicketId && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background animate-in slide-in-from-right-4 fade-in duration-200 flex flex-col">
            <TicketDetail
              ticket={selectedTicket}
              loading={ticketLoading}
              onClose={() => setSelectedTicketId(null)}
              onStatusChange={updateStatus}
              onSendMessage={sendMessage}
              profile={profile}
            />
          </div>
        )}

        {/* Mobile welcome screen when no ticket selected */}
        {!selectedTicketId && !mobileMenuOpen && (
          <div className="lg:hidden flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-xl bg-surface-light flex items-center justify-center mb-4">
              <MessageSquare className="w-7 h-7 text-text-muted" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">Welcome back</h3>
            <p className="text-sm text-text-secondary mb-4">
              Tap the menu to view tickets
            </p>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg active:scale-95 transition-transform"
            >
              View Tickets
            </button>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  )
}
