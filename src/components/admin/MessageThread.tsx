import { useRef, useEffect } from 'react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { FileText, Download } from 'lucide-react'
import type { MessageWithSender, Attachment } from '@/types/database'

interface MessageThreadProps {
  messages: MessageWithSender[]
  currentUserId?: string
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.file_type.startsWith('image/')
  const isVideo = attachment.file_type.startsWith('video/')

  return (
    <div className="mt-2 max-w-xs">
      {isImage ? (
        <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.file_url}
            alt={attachment.file_name}
            className="rounded-lg max-h-48 object-cover border border-white/10"
          />
        </a>
      ) : isVideo ? (
        <video
          src={attachment.file_url}
          controls
          className="rounded-lg max-h-48 border border-white/10"
        />
      ) : (
        <a
          href={attachment.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
        >
          <FileText className="w-8 h-8 text-slate-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {attachment.file_name}
            </p>
            <p className="text-xs text-slate-500">
              {formatFileSize(attachment.file_size)}
            </p>
          </div>
          <Download className="w-4 h-4 text-slate-500" />
        </a>
      )}
    </div>
  )
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0f]">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUserId
        const isAdmin = message.sender?.role === 'admin'

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
          >
            <Avatar
              src={message.sender?.avatar_url}
              name={message.sender?.full_name || message.sender?.email || 'User'}
              size="sm"
            />
            <div
              className={`max-w-[70%] ${
                isCurrentUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-300">
                  {message.sender?.full_name || message.sender?.email}
                </span>
                {isAdmin && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">
                    Staff
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {formatDate(message.created_at)}
                </span>
              </div>
              <div
                className={`rounded-lg px-4 py-2 ${
                  isAdmin
                    ? 'bg-cyan-500/10 text-slate-200 border border-cyan-500/20'
                    : 'bg-[#1a1a24] text-slate-200 border border-white/10'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.attachments?.map((attachment) => (
                <AttachmentPreview key={attachment.id} attachment={attachment} />
              ))}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
