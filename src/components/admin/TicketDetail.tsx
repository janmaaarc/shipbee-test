import { useState } from 'react'
import { MessageThread } from './MessageThread'
import { MessageInput } from './MessageInput'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'
import { updateTicketStatus, sendMessage } from '@/hooks/useTickets'
import { useFileUpload } from '@/hooks/useFileUpload'
import { X, ChevronDown } from 'lucide-react'
import type { TicketWithDetails, TicketStatus } from '@/types/database'

interface TicketDetailProps {
  ticket: TicketWithDetails
  currentUserId: string
  onClose: () => void
  onUpdate: () => void
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

export function TicketDetail({
  ticket,
  currentUserId,
  onClose,
  onUpdate,
}: TicketDetailProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [sending, setSending] = useState(false)
  const { uploadFiles, uploading } = useFileUpload()

  async function handleStatusChange(status: TicketStatus) {
    try {
      await updateTicketStatus(ticket.id, status)
      setShowStatusMenu(false)
      onUpdate()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  async function handleSendMessage(content: string, files: File[]) {
    setSending(true)
    try {
      const message = await sendMessage(ticket.id, currentUserId, content)
      if (files.length > 0) {
        await uploadFiles(files, message.id)
      }
      onUpdate()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar
              src={ticket.customer?.avatar_url}
              name={ticket.customer?.full_name || ticket.customer?.email || 'User'}
            />
            <div>
              <h2 className="font-semibold text-slate-900">
                {ticket.customer?.full_name || ticket.customer?.email}
              </h2>
              <p className="text-sm text-slate-500">{ticket.customer?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <h3 className="font-medium text-slate-900 mb-2">{ticket.subject}</h3>
          <div className="flex items-center gap-3">
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center gap-1 text-sm"
              >
                <StatusBadge status={ticket.status} />
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <PriorityBadge priority={ticket.priority} />
            <span className="text-sm text-slate-500">
              Created {formatDate(ticket.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageThread
        messages={ticket.messages || []}
        currentUserId={currentUserId}
      />

      {/* Input */}
      <div className="flex-shrink-0 border-t border-slate-200">
        <MessageInput
          onSend={handleSendMessage}
          disabled={sending || uploading}
          placeholder="Type your reply..."
        />
      </div>
    </div>
  )
}
