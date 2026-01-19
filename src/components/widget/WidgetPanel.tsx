import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTickets, useTicketDetails } from '../../hooks/useTickets'
import { WidgetLogin } from './WidgetLogin'
import { TicketList } from './TicketList'
import { TicketChat } from './TicketChat'
import { NewTicketForm } from './NewTicketForm'
import { Button } from '../ui/Button'

type View = 'tickets' | 'chat' | 'new'

interface WidgetPanelProps {
  onUnreadChange?: (count: number) => void
  onClose?: () => void
}

export function WidgetPanel({ onUnreadChange, onClose }: WidgetPanelProps) {
  const { user, profile, loading: authLoading } = useAuth()
  const [view, setView] = useState<View>('tickets')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const { tickets, loading: ticketsLoading, refetch: refetchTickets } = useTickets()
  const { ticket, loading: ticketLoading, sendMessage } = useTicketDetails(selectedTicketId, {
    profile,
    onMarkAsRead: refetchTickets,
  })

  // Track unread count based on tickets with unread messages
  useEffect(() => {
    if (onUnreadChange && tickets) {
      const unread = tickets.reduce((acc, t) => acc + (t.unread_count || 0), 0)
      onUnreadChange(unread)
    }
  }, [tickets, onUnreadChange])

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <WidgetLogin />
  }

  function handleTicketSelect(id: string) {
    setSelectedTicketId(id)
    setView('chat')
  }

  function handleNewTicket() {
    setView('new')
  }

  function handleTicketCreated(ticketId: string) {
    setSelectedTicketId(ticketId)
    setView('chat')
  }

  function handleBack() {
    setSelectedTicketId(null)
    setView('tickets')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          {view !== 'tickets' && (
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-surface-light"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="font-semibold text-white">
              {view === 'tickets' && 'Support'}
              {view === 'chat' && (ticket?.subject || 'Conversation')}
              {view === 'new' && 'New Ticket'}
            </h2>
            {view === 'tickets' && (
              <p className="text-xs text-text-muted">
                Hi {profile?.full_name?.split(' ')[0] || 'there'}! How can we help?
              </p>
            )}
          </div>
          {view === 'tickets' && (
            <Button size="sm" onClick={handleNewTicket}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="p-1.5 text-text-secondary hover:text-white rounded-lg hover:bg-surface-light transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'tickets' && (
          <TicketList
            tickets={tickets}
            loading={ticketsLoading}
            onSelect={handleTicketSelect}
          />
        )}
        {view === 'chat' && (
          <TicketChat
            ticket={ticket}
            loading={ticketLoading}
            onSendMessage={sendMessage}
            profile={profile}
          />
        )}
        {view === 'new' && (
          <NewTicketForm
            onSuccess={handleTicketCreated}
            onCancel={handleBack}
          />
        )}
      </div>
    </div>
  )
}
