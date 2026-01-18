import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTicketDetails, sendMessage } from '@/hooks/useTickets'
import { useFileUpload } from '@/hooks/useFileUpload'
import { MessageThread } from '@/components/admin/MessageThread'
import { MessageInput } from '@/components/admin/MessageInput'
import { StatusBadge } from '@/components/ui/Badge'

interface TicketChatProps {
  ticketId: string
}

export function TicketChat({ ticketId }: TicketChatProps) {
  const { user } = useAuth()
  const { ticket, loading, refetch } = useTicketDetails(ticketId)
  const { uploadFiles, uploading } = useFileUpload()
  const [sending, setSending] = useState(false)

  async function handleSendMessage(content: string, files: File[]) {
    if (!user) return
    setSending(true)
    try {
      const message = await sendMessage(ticketId, user.id, content)
      if (files.length > 0) {
        await uploadFiles(files, message.id)
      }
      refetch()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Ticket not found
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Ticket info */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 bg-[#12121a]">
        <p className="font-medium text-white text-sm">{ticket.subject}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Messages */}
      <MessageThread messages={ticket.messages || []} currentUserId={user?.id} />

      {/* Input */}
      <div className="flex-shrink-0 border-t border-white/10 bg-[#12121a]">
        <MessageInput
          onSend={handleSendMessage}
          disabled={sending || uploading}
          placeholder="Type your message..."
        />
      </div>
    </div>
  )
}
