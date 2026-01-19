import { useEffect, useRef, useMemo, useState } from 'react'
import { FileText, Image, Film, Download, Maximize2 } from 'lucide-react'
import { formatFileSize } from '../../lib/utils'
import { Avatar } from '../ui/Avatar'
import { ImageLightbox } from '../ui/ImageLightbox'
import { MessageReactions } from './MessageReactions'
import { useReactions } from '../../hooks/useReactions'
import type { MessageWithSender } from '../../types/database'

interface MessageThreadProps {
  messages: MessageWithSender[]
}

function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return d1.toDateString() === d2.toDateString()
}

function formatDateSeparator(date: string): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean
    images: { url: string; alt?: string }[]
    initialIndex: number
  }>({ isOpen: false, images: [], initialIndex: 0 })

  // Reactions management
  const { getReactions, addReaction, removeReaction } = useReactions()

  // Scroll to bottom with slight delay for rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
    }, 50)
    return () => clearTimeout(timer)
  }, [messages])

  // Collect all images from messages for gallery navigation
  const allImages = useMemo(() => {
    return messages.flatMap((msg) =>
      (msg.attachments || [])
        .filter((att) => att.file_type.startsWith('image/'))
        .map((att) => ({ url: att.file_url, alt: att.file_name }))
    )
  }, [messages])

  function openLightbox(imageUrl: string) {
    const index = allImages.findIndex((img) => img.url === imageUrl)
    setLightbox({
      isOpen: true,
      images: allImages,
      initialIndex: index >= 0 ? index : 0,
    })
  }

  const messagesWithSeparators = useMemo(() => {
    const result: { type: 'date' | 'message'; date?: string; message?: MessageWithSender }[] = []
    let lastDate: string | null = null

    messages.forEach((message) => {
      if (!lastDate || !isSameDay(lastDate, message.created_at)) {
        result.push({ type: 'date', date: message.created_at })
        lastDate = message.created_at
      }
      result.push({ type: 'message', message })
    })

    return result
  }, [messages])

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Film
    return FileText
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messagesWithSeparators.map((item, index) => {
        if (item.type === 'date' && item.date) {
          return (
            <div key={`date-${index}`} className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted font-medium px-2">
                {formatDateSeparator(item.date)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )
        }

        if (item.type === 'message' && item.message) {
          const message = item.message
          const isAdmin = message.sender.role === 'admin'

          return (
            <div
              key={message.id}
              className={`flex gap-3 animate-in fade-in duration-200 ${isAdmin ? 'flex-row-reverse' : ''}`}
            >
              <Avatar
                src={message.sender.avatar_url}
                name={message.sender.full_name}
                size="sm"
              />
              <div className={`flex-1 max-w-[75%] ${isAdmin ? 'flex flex-col items-end' : ''}`}>
                <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm font-medium text-white">
                    {message.sender.full_name || message.sender.email}
                  </span>
                  {isAdmin && (
                    <span className="text-xs px-1.5 py-0.5 bg-brand-500/20 text-brand-400 rounded font-medium">
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
                      ? 'bg-brand-500/20 text-white rounded-tr-md'
                      : 'bg-surface-light text-text-primary rounded-tl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment) => {
                        const FileIcon = getFileIcon(attachment.file_type)

                        if (attachment.file_type.startsWith('image/')) {
                          return (
                            <button
                              key={attachment.id}
                              onClick={() => openLightbox(attachment.file_url)}
                              className="block group relative text-left"
                            >
                              <img
                                src={attachment.file_url}
                                alt={attachment.file_name}
                                className="max-w-full rounded-lg max-h-48 object-cover transition-all group-hover:opacity-90 group-hover:scale-[1.02]"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                                <Maximize2 className="w-6 h-6 text-white" />
                              </div>
                            </button>
                          )
                        }

                        if (attachment.file_type.startsWith('video/')) {
                          return (
                            <video
                              key={attachment.id}
                              src={attachment.file_url}
                              controls
                              className="max-w-full rounded-lg max-h-48"
                            />
                          )
                        }

                        return (
                          <a
                            key={attachment.id}
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 bg-surface rounded-lg hover:bg-surface-light/80 transition-colors group"
                          >
                            <div className="p-2 bg-surface-light rounded-lg group-hover:bg-surface transition-colors">
                              <FileIcon className="w-4 h-4 text-text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{attachment.file_name}</p>
                              <p className="text-xs text-text-muted">
                                {formatFileSize(attachment.file_size)}
                              </p>
                            </div>
                            <Download className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                <MessageReactions
                  reactions={getReactions(message.id)}
                  onReact={(emoji) => addReaction(message.id, emoji)}
                  onRemoveReaction={(emoji) => removeReaction(message.id, emoji)}
                  className="mt-1"
                />
              </div>
            </div>
          )
        }

        return null
      })}
      <div ref={bottomRef} />

      {/* Image Lightbox */}
      {lightbox.isOpen && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.initialIndex}
          onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  )
}
