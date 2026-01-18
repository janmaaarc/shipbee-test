import { useState } from 'react'
import { TicketList } from './TicketList'
import { TicketChat } from './TicketChat'
import { NewTicketForm } from './NewTicketForm'
import { ChevronLeft, Plus } from 'lucide-react'

type View = 'list' | 'chat' | 'new'

interface WidgetPanelProps {
  onClose: () => void
}

export function WidgetPanel({ onClose: _onClose }: WidgetPanelProps) {
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
    <div className="absolute bottom-20 right-0 w-[380px] h-[560px] bg-[#12121a] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-scale-in origin-bottom-right">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#12121a] border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
          )}
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">SB</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-white">
              {view === 'new' ? 'New Message' : 'Support'}
            </h2>
          </div>
          {view === 'list' && (
            <button
              onClick={handleNewTicket}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="New message"
            >
              <Plus className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[#0a0a0f]">
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
