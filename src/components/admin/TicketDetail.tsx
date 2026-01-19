import { useState } from 'react'
import { X, Clock, AlertCircle, CheckCircle, XCircle, MousePointerClick, ChevronLeft } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { Avatar } from '../ui/Avatar'
import { MessageThread } from './MessageThread'
import { MessageInput } from './MessageInput'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton, SkeletonAvatar } from '../ui/Skeleton'
import { TypingIndicator } from '../ui/TypingIndicator'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useToast } from '../ui/Toast'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import { useSwipeBack } from '../../hooks/useSwipeGesture'
import { useMentionableUsers } from '../../hooks/useMentionableUsers'
import type { TicketWithDetails, TicketStatus, Profile } from '../../types/database'

interface TicketDetailProps {
  ticket: TicketWithDetails | null
  loading: boolean
  onClose: () => void
  onStatusChange: (status: TicketStatus) => Promise<{ error: Error | null }>
  onSendMessage: (content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) => Promise<{ error: Error | null }>
  profile?: Profile | null
}

const statusConfig: Record<TicketStatus, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  open: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Open' },
  pending: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Pending' },
  resolved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Resolved' },
  closed: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Closed' },
}

export function TicketDetail({ ticket, loading, onClose, onStatusChange, onSendMessage, profile }: TicketDetailProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; status: TicketStatus | null }>({
    open: false,
    status: null,
  })
  const { addToast } = useToast()

  const { typingUsers, onTyping, stopTyping, isAnyoneTyping } = useTypingIndicator({
    ticketId: ticket?.id || null,
    profile: profile || null,
  })

  // Mentionable users for @ mentions
  const { users: mentionableUsers, loading: mentionsLoading } = useMentionableUsers({
    customer: ticket?.customer || null,
  })

  // Swipe right to go back on mobile
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
          description="Choose a ticket from the list to view the conversation and details."
        />
      </div>
    )
  }

  const StatusIcon = statusConfig[ticket.status].icon

  function handleStatusSelect(status: TicketStatus) {
    if (!ticket || status === ticket.status) return

    // Show confirmation for closing or resolving
    if (status === 'closed' || status === 'resolved') {
      setConfirmDialog({ open: true, status })
    } else {
      performStatusChange(status)
    }
  }

  async function performStatusChange(status: TicketStatus) {
    setUpdatingStatus(true)
    setConfirmDialog({ open: false, status: null })

    const { error } = await onStatusChange(status)
    if (error) {
      addToast('error', 'Failed to update status')
    } else {
      addToast('success', `Ticket marked as ${statusConfig[status].label.toLowerCase()}`)
    }
    setUpdatingStatus(false)
  }

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
            {/* Back button on mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 -ml-1 text-text-secondary hover:text-white active:scale-95 rounded-lg transition-all duration-150 flex-shrink-0 touch-press"
              aria-label="Back to ticket list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">{ticket.subject}</h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-2">
                <Avatar
                  src={ticket.customer.avatar_url}
                  name={ticket.customer.full_name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">
                    {ticket.customer.full_name || 'Customer'}
                  </p>
                  <p className="text-xs text-text-muted truncate">{ticket.customer.email}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Close button on desktop */}
          <button
            onClick={onClose}
            className="hidden lg:flex p-2 text-text-secondary hover:text-white rounded-lg hover:bg-surface-light transition-colors"
            aria-label="Close ticket details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status and metadata */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${statusConfig[ticket.status].bg} transition-colors`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig[ticket.status].color}`} />
            </div>
            <label htmlFor="status-select" className="sr-only">Ticket status</label>
            <select
              id="status-select"
              value={ticket.status}
              onChange={(e) => handleStatusSelect(e.target.value as TicketStatus)}
              disabled={updatingStatus}
              className="bg-surface-light border border-border rounded-lg px-2.5 sm:px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="text-xs sm:text-sm text-text-muted">
            Created {formatDate(ticket.created_at)}
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

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-surface-light/30 safe-area-inset-bottom">
        <MessageInput
          onSend={handleSendMessage}
          onTyping={onTyping}
          mentionableUsers={mentionableUsers}
          mentionsLoading={mentionsLoading}
        />
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, status: null })}
        onConfirm={() => confirmDialog.status && performStatusChange(confirmDialog.status)}
        title={`${confirmDialog.status === 'closed' ? 'Close' : 'Resolve'} this ticket?`}
        description={
          confirmDialog.status === 'closed'
            ? 'This will close the ticket. The customer won\'t be able to reply unless a new ticket is created.'
            : 'This will mark the ticket as resolved. The customer can still reply if needed.'
        }
        confirmText={confirmDialog.status === 'closed' ? 'Close Ticket' : 'Resolve Ticket'}
        variant={confirmDialog.status === 'closed' ? 'warning' : 'default'}
        loading={updatingStatus}
      />
    </div>
  )
}
