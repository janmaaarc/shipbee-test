import { useEffect, useRef } from 'react'
import { FileText, Image, Film, Download, Lock } from 'lucide-react'
import { formatFileSize } from '../../lib/utils'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { MessageInput } from '../admin/MessageInput'
import { Skeleton, SkeletonAvatar } from '../ui/Skeleton'
import { TypingIndicator } from '../ui/TypingIndicator'
import { useTypingIndicator } from '../../hooks/useTypingIndicator'
import type { TicketWithDetails, TicketStatus, Profile } from '../../types/database'

interface TicketChatProps {
  ticket: TicketWithDetails | null
  loading: boolean
  onSendMessage: (content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) => Promise<{ error: Error | null }>
  profile?: Profile | null
}

const statusVariant: Record<TicketStatus, 'default' | 'warning' | 'success' | 'info'> = {
  open: 'warning',
  pending: 'info',
  resolved: 'success',
  closed: 'default',
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function TicketChat({ ticket, loading, onSendMessage, profile }: TicketChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const { typingUsers, onTyping, stopTyping, isAnyoneTyping } = useTypingIndicator({
    ticketId: ticket?.id || null,
    profile: profile || null,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages])

  const typingName = typingUsers.length > 0
    ? typingUsers.length === 1
      ? typingUsers[0].name
      : `${typingUsers.length} people`
    : undefined

  async function handleSendMessage(content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) {
    stopTyping()
    return onSendMessage(content, attachments)
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 border-b border-border">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-2">
              <SkeletonAvatar size="sm" />
              <Skeleton className="flex-1 h-16 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center">
        <p className="text-text-secondary">Ticket not found</p>
      </div>
    )
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Film
    return FileText
  }

  return (
    <div className="h-full flex flex-col">
      {/* Status bar */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Status:</span>
          <Badge variant={statusVariant[ticket.status]} dot>{ticket.status}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ticket.messages.map((message) => {
          const isAdmin = message.sender.role === 'admin'

          return (
            <div
              key={message.id}
              className={`flex gap-2 animate-in fade-in duration-200 ${isAdmin ? '' : 'flex-row-reverse'}`}
            >
              <Avatar
                src={message.sender.avatar_url}
                name={message.sender.full_name}
                size="sm"
              />
              <div className={`max-w-[80%] ${isAdmin ? '' : 'flex flex-col items-end'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isAdmin ? '' : 'flex-row-reverse'}`}>
                  {isAdmin && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-medium">
                      Support
                    </span>
                  )}
                  <span className="text-xs text-text-muted">
                    {formatTime(message.created_at)}
                  </span>
                </div>
                <div
                  className={`inline-block p-3 rounded-2xl ${
                    isAdmin
                      ? 'bg-surface-light text-white rounded-tl-md'
                      : 'bg-amber-500/20 text-white rounded-tr-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => {
                        const FileIcon = getFileIcon(attachment.file_type)

                        if (attachment.file_type.startsWith('image/')) {
                          return (
                            <a
                              key={attachment.id}
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block group relative"
                            >
                              <img
                                src={attachment.file_url}
                                alt={attachment.file_name}
                                className="max-w-full rounded-lg max-h-32 object-cover transition-opacity group-hover:opacity-90"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                                <Download className="w-5 h-5 text-white" />
                              </div>
                            </a>
                          )
                        }

                        if (attachment.file_type.startsWith('video/')) {
                          return (
                            <video
                              key={attachment.id}
                              src={attachment.file_url}
                              controls
                              className="max-w-full rounded-lg max-h-32"
                            />
                          )
                        }

                        return (
                          <a
                            key={attachment.id}
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-surface rounded-lg hover:bg-surface-light/80 transition-colors group"
                          >
                            <FileIcon className="w-4 h-4 text-text-secondary" />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs text-white truncate">{attachment.file_name}</p>
                              <p className="text-xs text-text-muted">
                                {formatFileSize(attachment.file_size)}
                              </p>
                            </div>
                            <Download className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {isAnyoneTyping && (
        <div className="px-4 py-2 border-t border-border/50">
          <TypingIndicator name={typingName} />
        </div>
      )}

      {/* Input */}
      {ticket.status !== 'closed' ? (
        <div className="flex-shrink-0 border-t border-border bg-surface-light/30">
          <MessageInput onSend={handleSendMessage} onTyping={onTyping} />
        </div>
      ) : (
        <div className="flex-shrink-0 p-4 border-t border-border bg-surface-light/30">
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Lock className="w-4 h-4" />
            <p className="text-sm">This ticket has been closed</p>
          </div>
        </div>
      )}
    </div>
  )
}
