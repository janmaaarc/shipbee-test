import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/lib/utils'
import { MessageSquare, ChevronRight } from 'lucide-react'
import type { Ticket } from '@/types/database'

interface TicketListProps {
  onSelect: (ticketId: string) => void
  onNewTicket: () => void
}

export function TicketList({ onSelect, onNewTicket }: TicketListProps) {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTickets() {
      if (!user) return

      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', user.id)
        .order('updated_at', { ascending: false })

      setTickets(data || [])
      setLoading(false)
    }

    fetchTickets()
  }, [user])

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading your conversations...
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="font-medium text-white mb-2">No conversations yet</h3>
        <p className="text-sm text-slate-400 mb-4">
          Start a new conversation to get help from our team
        </p>
        <button
          onClick={onNewTicket}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-cyan-400 hover:to-cyan-500 transition-all"
        >
          Start a conversation
        </button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5 overflow-y-auto h-full">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket.id)}
          className="w-full p-4 text-left hover:bg-white/5 transition-colors flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={ticket.status} />
              <span className="text-xs text-slate-500">
                {formatRelativeTime(ticket.updated_at)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}
