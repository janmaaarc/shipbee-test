import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTickets, useTicketDetails, useTicketStats } from '@/hooks/useTickets'
import { TicketList } from '@/components/admin/TicketList'
import { TicketDetail } from '@/components/admin/TicketDetail'
import { Filters } from '@/components/admin/Filters'
import { StatsCards } from '@/components/admin/StatsCards'
import { Button } from '@/components/ui/Button'
import { LogOut, Inbox } from 'lucide-react'
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
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              ShipBee Support
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {profile?.full_name || profile?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Ticket list panel */}
        <div className="w-[400px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
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
        <div className="flex-1 bg-white">
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              currentUserId={user?.id || ''}
              onClose={() => setSelectedTicketId(null)}
              onUpdate={refetchTicket}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Inbox className="w-16 h-16 mb-4" />
              <p className="text-lg">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
