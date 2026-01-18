import { formatRelativeTime } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import type { TicketWithDetails } from '@/types/database'

interface TicketListProps {
  tickets: TicketWithDetails[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function TicketList({ tickets, selectedId, onSelect }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No tickets found</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5">
      {tickets.map((ticket) => (
        <button
          key={ticket.id}
          onClick={() => onSelect(ticket.id)}
          className={`w-full p-4 text-left hover:bg-white/5 transition-all duration-200 ${
            selectedId === ticket.id ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : 'border-l-2 border-transparent'
          }`}
        >
          <div className="flex items-start gap-3">
            <Avatar
              name={ticket.customer?.full_name || ticket.customer?.email || 'User'}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white truncate">
                  {ticket.customer?.full_name || ticket.customer?.email}
                </p>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {formatRelativeTime(ticket.updated_at)}
                </span>
              </div>
              <p className="text-sm text-slate-300 truncate mt-0.5">
                {ticket.subject}
              </p>
              {ticket.last_message && (
                <p className="text-sm text-slate-500 truncate mt-1">
                  {ticket.last_message.content}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
