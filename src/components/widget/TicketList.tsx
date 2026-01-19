import { MessageSquare, ChevronRight } from 'lucide-react'
import { formatRelativeTime, statusVariant } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import type { TicketWithCustomer } from '../../types/database'

interface TicketListProps {
  tickets: TicketWithCustomer[]
  loading: boolean
  onSelect: (id: string) => void
}

export function TicketList({ tickets, loading, onSelect }: TicketListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-3 bg-surface border border-border rounded-xl animate-pulse"
          >
            <div className="h-4 w-3/4 bg-surface-light rounded mb-2" />
            <div className="h-3 w-1/2 bg-surface-light rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 bg-surface-light rounded-full flex items-center justify-center mb-3">
          <MessageSquare className="w-6 h-6 text-text-muted" />
        </div>
        <p className="text-white font-medium mb-1">No conversations yet</p>
        <p className="text-sm text-text-secondary">
          Start a new ticket to get help from our team.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-2 overflow-y-auto h-full">
      {tickets.map((ticket) => {
        const hasUnread = ticket.unread_count && ticket.unread_count > 0
        const displayTime = ticket.last_message_at || ticket.updated_at

        return (
          <button
            key={ticket.id}
            onClick={() => onSelect(ticket.id)}
            className={`w-full p-3 text-left bg-surface border rounded-xl hover:border-white/20 transition-colors group ${
              hasUnread ? 'border-amber-500/40' : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {hasUnread && (
                    <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                  <p className={`truncate ${hasUnread ? 'font-semibold text-white' : 'font-medium text-white'}`}>
                    {ticket.subject}
                  </p>
                  {hasUnread && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium bg-amber-500 text-black rounded-full">
                      {ticket.unread_count}
                    </span>
                  )}
                </div>
                {ticket.last_message && (
                  <p className={`text-xs truncate mt-1 ${hasUnread ? 'text-text-secondary' : 'text-text-muted'}`}>
                    {ticket.last_message}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={statusVariant[ticket.status]} size="sm">
                    {ticket.status}
                  </Badge>
                  <span className={`text-xs ${hasUnread ? 'text-amber-400 font-medium' : 'text-text-muted'}`}>
                    {formatRelativeTime(displayTime)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
