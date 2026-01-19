import { Clock, AlertCircle, CheckCircle, XCircle, MousePointerClick, ChevronLeft, Lock } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { MessageThread } from '../admin/MessageThread'
import { MessageInput } from '../admin/MessageInput'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton, SkeletonAvatar } from '../ui/Skeleton'
import { TypingIndicator } from '../ui/TypingIndicator'
import { useToast } from '../ui/Toast'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { useSwipeBack } from '../../hooks/useSwipeGesture'
import type { TicketWithDetails, TicketStatus, Profile } from '../../types/database'

interface CustomerTicketDetailProps {
  ticket: TicketWithDetails | null
  loading: boolean
  onClose: () => void
  onSendMessage: (content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) => Promise<{ error: Error | null }>
  profile?: Profile | null
}

const statusConfig: Record<TicketStatus, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  open: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Awaiting Response' },
  pending: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
  resolved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Resolved' },
  closed: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Closed' },
}

export function CustomerTicketDetail({ ticket, loading, onClose, onSendMessage, profile }: CustomerTicketDetailProps) {
  const { addToast } = useToast()

  const { typingUsers, onTyping, stopTyping, isAnyoneTyping } = useTypingIndicator({
    ticketId: ticket?.id || null,
    profile: profile || null,
  })

  const swipeRef = useSwipeBack(onClose, !!ticket)

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-surface lg:border-l border-border">
        <div className="p-3 sm:p-4 border-b border-border safe-area-inset-top">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Skeleton className="h-5 sm:h-6 w-3/4 mb-3" />
              <div className="flex items-center gap-2 sm:gap-3">
                <SkeletonAvatar size="sm" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-3 sm:p-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <SkeletonAvatar size="sm" />
                <Skeleton className="flex-1 h-20 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center bg-surface lg:border-l border-border p-6">
        <EmptyState
          icon={MousePointerClick}
          title="Select a ticket"
          description="Choose a ticket from the list to view the conversation."
        />
      </div>
    )
  }

  const StatusIcon = statusConfig[ticket.status].icon

  async function handleSendMessage(content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) {
    stopTyping()
    const { error } = await onSendMessage(content, attachments)
    if (error) {
      addToast('error', 'Failed to send message')
    }
    return { error }
  }

  const typingName = typingUsers.length > 0
    ? typingUsers.length === 1
      ? typingUsers[0].name
      : `${typingUsers.length} people`
    : undefined

  return (
    <div ref={swipeRef} className="h-full flex flex-col bg-surface lg:border-l border-border">
      {/* Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border safe-area-inset-top">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              onClick={onClose}
              className="lg:hidden p-2 -ml-1 text-text-secondary hover:text-white active:scale-95 rounded-lg transition-all duration-150 flex-shrink-0"
              aria-label="Back to ticket list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">{ticket.subject}</h2>
              <p className="text-xs text-text-muted mt-1">
                Created {formatDate(ticket.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Status display */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${statusConfig[ticket.status].bg}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig[ticket.status].color}`} />
            </div>
            <span className="text-sm text-white font-medium">
              {statusConfig[ticket.status].label}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageThread messages={ticket.messages} />
      </div>

      {/* Typing indicator */}
      {isAnyoneTyping && (
        <div className="px-4 py-2 border-t border-border/50">
          <TypingIndicator name={typingName} />
        </div>
      )}

      {/* Input or closed notice */}
      {ticket.status !== 'closed' ? (
        <div className="flex-shrink-0 border-t border-border bg-surface-light/30 safe-area-inset-bottom">
          <MessageInput onSend={handleSendMessage} onTyping={onTyping} showQuickActions={false} />
        </div>
      ) : (
        <div className="flex-shrink-0 p-4 border-t border-border bg-surface-light/30 safe-area-inset-bottom">
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Lock className="w-4 h-4" />
            <p className="text-sm">This ticket has been closed. Create a new ticket if you need more help.</p>
          </div>
        </div>
      )}
    </div>
  )
}
