import { useRef, useCallback } from 'react'
import { Inbox, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { formatRelativeTime, formatDate } from '../../lib/utils'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonCard } from '../ui/Skeleton'
import { Button } from '../ui/Button'
import type { TicketWithCustomer, TicketStatus } from '../../types/database'

interface CustomerTicketListProps {
  tickets: TicketWithCustomer[]
  selectedId: string | null
  onSelect: (id: string) => void
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  error?: string | null
  onRetry?: () => void
}

const statusVariant: Record<TicketStatus, 'default' | 'warning' | 'success' | 'info'> = {
  open: 'warning',
  pending: 'info',
  resolved: 'success',
  closed: 'default',
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Awaiting Response',
  pending: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export function CustomerTicketList({ tickets, selectedId, onSelect, loading, loadingMore, hasMore, onLoadMore, error, onRetry }: CustomerTicketListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = Math.min(currentIndex + 1, tickets.length - 1)
      const nextTicket = tickets[nextIndex]
      if (nextTicket) {
        onSelect(nextTicket.id)
        const buttons = listRef.current?.querySelectorAll('button[data-ticket]')
        ;(buttons?.[nextIndex] as HTMLElement)?.focus()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = Math.max(currentIndex - 1, 0)
      const prevTicket = tickets[prevIndex]
      if (prevTicket) {
        onSelect(prevTicket.id)
        const buttons = listRef.current?.querySelectorAll('button[data-ticket]')
        ;(buttons?.[prevIndex] as HTMLElement)?.focus()
      }
    }
  }, [tickets, onSelect])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-sm font-medium text-white mb-1">Failed to load tickets</h3>
        <p className="text-xs text-text-muted mb-4 max-w-xs">{error}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No support tickets"
        description="You haven't created any support tickets yet. Click 'New Ticket' to get help from our team."
        className="py-12"
      />
    )
  }

  return (
    <div ref={listRef} className="space-y-2" role="listbox" aria-label="Your support tickets">
      {tickets.map((ticket, index) => {
        const hasUnread = ticket.unread_count && ticket.unread_count > 0
        const displayTime = ticket.last_message_at || ticket.updated_at || ticket.created_at
        const fullDate = formatDate(displayTime)

        return (
          <button
            key={ticket.id}
            data-ticket={ticket.id}
            onClick={() => onSelect(ticket.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="option"
            aria-selected={selectedId === ticket.id}
            className={`w-full p-4 text-left rounded-xl border transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-brand-500/50 active:scale-[0.98] ${
              selectedId === ticket.id
                ? 'bg-surface-light border-brand-500/50 ring-1 ring-brand-500/20'
                : hasUnread
                ? 'bg-surface border-brand-500/30 hover:border-brand-500/50'
                : 'bg-surface border-border hover:border-white/20 hover:bg-surface-light/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-medium truncate ${hasUnread ? 'text-white' : 'text-white'}`}>
                    {ticket.subject}
                  </p>
                  {hasUnread && (
                    <span className="flex-shrink-0 w-2 h-2 bg-brand-500 rounded-full" />
                  )}
                </div>
                {ticket.last_message && (
                  <p className="text-sm text-text-secondary truncate mb-2">
                    {ticket.last_message}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant[ticket.status]} size="sm">
                    {statusLabels[ticket.status]}
                  </Badge>
                  <span
                    className="text-xs text-text-muted"
                    title={fullDate}
                  >
                    {formatRelativeTime(displayTime)}
                  </span>
                </div>
              </div>
            </div>
          </button>
        )
      })}

      {hasMore && onLoadMore && (
        <div className="pt-2">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
