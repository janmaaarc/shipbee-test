import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTickets, useTicketDetails, useTicketStats } from '@/hooks/useTickets'
import { TicketList } from '@/components/admin/TicketList'
import { TicketDetail } from '@/components/admin/TicketDetail'
import { Filters } from '@/components/admin/Filters'
import { StatsCards } from '@/components/admin/StatsCards'
import { Avatar } from '@/components/ui/Avatar'
import { LogOut, Inbox, MessageSquare, Loader2 } from 'lucide-react'
import type { TicketStatus } from '@/types/database'

export function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')

  const { stats } = useTicketStats()
  const { tickets, loading } = useTickets(
    statusFilter === 'all' ? undefined : [statusFilter]
  )
  const { ticket: selectedTicket, refetch: refetchTicket } = useTicketDetails(
    selectedTicketId
  )

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets
    const query = searchQuery.toLowerCase()
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(query) ||
        t.customer?.email?.toLowerCase().includes(query) ||
        t.customer?.full_name?.toLowerCase().includes(query)
    )
  }, [tickets, searchQuery])

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#12121a] border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <h1 className="text-lg font-semibold text-white">
              ShipBee Support
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar
              name={profile?.full_name || profile?.email || 'User'}
              size="sm"
            />
            <span className="text-sm text-slate-300">
              {profile?.full_name || profile?.email}
            </span>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Ticket list panel */}
        <div className="w-[380px] flex-shrink-0 bg-[#12121a] rounded-xl border border-white/10 flex flex-col overflow-hidden animate-fade-in-up">
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-sm">No tickets found</p>
              </div>
            ) : (
              <TicketList
                tickets={filteredTickets}
                selectedId={selectedTicketId}
                onSelect={setSelectedTicketId}
              />
            )}
          </div>
        </div>

        {/* Ticket detail panel */}
        <div className="flex-1 bg-[#12121a] rounded-xl border border-white/10 overflow-hidden animate-fade-in-up animate-delay-100">
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              currentUserId={user?.id || ''}
              onClose={() => setSelectedTicketId(null)}
              onUpdate={refetchTicket}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Inbox className="w-10 h-10 mb-3" />
              <p className="text-sm">Select a ticket to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
