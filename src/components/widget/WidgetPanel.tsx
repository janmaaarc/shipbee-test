import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { TicketList } from './TicketList'
import { TicketChat } from './TicketChat'
import { NewTicketForm } from './NewTicketForm'
import { ChevronLeft, Plus } from 'lucide-react'

type View = 'list' | 'chat' | 'new'

interface WidgetPanelProps {
  onClose: () => void
}

export function WidgetPanel({ onClose: _onClose }: WidgetPanelProps) {
  const { profile } = useAuth()
  const [view, setView] = useState<View>('list')
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  function handleSelectTicket(ticketId: string) {
    setSelectedTicketId(ticketId)
    setView('chat')
  }

  function handleBack() {
    setView('list')
    setSelectedTicketId(null)
  }

  function handleNewTicket() {
    setView('new')
  }

  function handleTicketCreated(ticketId: string) {
    setSelectedTicketId(ticketId)
    setView('chat')
  }

  return (
    <div className="absolute bottom-20 right-0 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="flex-shrink-0 bg-amber-500 text-white p-4">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="font-semibold">
              {view === 'new' ? 'New Conversation' : 'ShipBee Support'}
            </h2>
            {view === 'list' && (
              <p className="text-sm text-amber-100">
                Hi {profile?.full_name?.split(' ')[0] || 'there'}! How can we help?
              </p>
            )}
          </div>
          {view === 'list' && (
            <button
              onClick={handleNewTicket}
              className="p-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <TicketList onSelect={handleSelectTicket} onNewTicket={handleNewTicket} />
        )}
        {view === 'chat' && selectedTicketId && (
          <TicketChat ticketId={selectedTicketId} />
        )}
        {view === 'new' && (
          <NewTicketForm onSuccess={handleTicketCreated} onCancel={handleBack} />
        )}
      </div>
    </div>
  )
}
