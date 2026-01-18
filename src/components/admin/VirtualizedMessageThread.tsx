import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { FileText, Image, Film, Download, Maximize2 } from 'lucide-react'
import { formatFileSize } from '../../lib/utils'
import { Avatar } from '../ui/Avatar'
import { ImageLightbox } from '../ui/ImageLightbox'
import type { MessageWithSender } from '../../types/database'

interface VirtualizedMessageThreadProps {
  messages: MessageWithSender[]
  estimatedItemHeight?: number
  overscan?: number
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

export function VirtualizedMessageThread({
  messages,
  estimatedItemHeight = 120,
  overscan = 5,
}: VirtualizedMessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean
    images: { url: string; alt?: string }[]
    initialIndex: number
  }>({ isOpen: false, images: [], initialIndex: 0 })

  // Prepare messages with date separators
  const messagesWithSeparators = useMemo(() => {
    const result: { type: 'date' | 'message'; date?: string; message?: MessageWithSender; key: string }[] = []
    let lastDate: string | null = null

    messages.forEach((message, index) => {
      if (!lastDate || !isSameDay(lastDate, message.created_at)) {
        result.push({ type: 'date', date: message.created_at, key: `date-${index}` })
        lastDate = message.created_at
      }
      result.push({ type: 'message', message, key: message.id })
    })

    return result
  }, [messages])

  // Collect all images for gallery navigation
  const allImages = useMemo(() => {
    return messages.flatMap((msg) =>
      (msg.attachments || [])
        .filter((att) => att.file_type.startsWith('image/'))
        .map((att) => ({ url: att.file_url, alt: att.file_name }))
    )
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Update visible range on scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop, clientHeight } = containerRef.current
    const start = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan)
    const end = Math.min(
      messagesWithSeparators.length,
      Math.ceil((scrollTop + clientHeight) / estimatedItemHeight) + overscan
    )

    setVisibleRange({ start, end })
  }, [estimatedItemHeight, overscan, messagesWithSeparators.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Initial calculation
    handleScroll()

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  function openLightbox(imageUrl: string) {
    const index = allImages.findIndex((img) => img.url === imageUrl)
    setLightbox({
      isOpen: true,
      images: allImages,
      initialIndex: index >= 0 ? index : 0,
    })
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Film
    return FileText
  }

  // For small message counts, render all
  const shouldVirtualize = messagesWithSeparators.length > 50
  const visibleItems = shouldVirtualize
    ? messagesWithSeparators.slice(visibleRange.start, visibleRange.end)
    : messagesWithSeparators

  const paddingTop = shouldVirtualize ? visibleRange.start * estimatedItemHeight : 0
  const paddingBottom = shouldVirtualize
    ? (messagesWithSeparators.length - visibleRange.end) * estimatedItemHeight
    : 0

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-4">
      {/* Virtual padding top */}
      {shouldVirtualize && paddingTop > 0 && <div style={{ height: paddingTop }} />}

      <div className="space-y-4">
        {visibleItems.map((item) => {
          if (item.type === 'date' && item.date) {
            return (
              <div key={item.key} className="flex items-center gap-4 py-2">
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
                key={item.key}
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
                </div>
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Virtual padding bottom */}
      {shouldVirtualize && paddingBottom > 0 && <div style={{ height: paddingBottom }} />}

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
