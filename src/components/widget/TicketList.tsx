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
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="font-medium text-slate-900 mb-2">No conversations yet</h3>
        <p className="text-sm text-slate-500 mb-4">
          Start a new conversation to get help from our team
        </p>
        <button
          onClick={onNewTicket}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          Start a conversation
        </button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 overflow-y-auto h-full">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket.id)}
          className="w-full p-4 text-left hover:bg-slate-50 transition-colors flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={ticket.status} />
              <span className="text-xs text-slate-500">
                {formatRelativeTime(ticket.updated_at)}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </button>
      ))}
    </div>
  )
}
