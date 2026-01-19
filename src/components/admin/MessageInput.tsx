import { useState, useRef, useEffect, useCallback } from 'react'
import type { DragEvent } from 'react'
import { Send, Paperclip, X, Image, Film, FileText, Loader2, AlertTriangle, Zap, Upload } from 'lucide-react'
import { Button } from '../ui/Button'
import { useFileUpload } from '../../hooks/useFileUpload'
import { useMessageRateLimit } from '../../hooks/useRateLimit'
import { useCannedResponses } from '../../hooks/useCannedResponses'
import { CannedResponsesPicker } from './CannedResponsesPicker'
import { sanitizeInput, sanitizeFileName, isFileTypeSafe } from '../../lib/utils'

interface MessageInputProps {
  onSend: (content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) => Promise<{ error: Error | null }>
  onTyping?: () => void
}

interface PendingFile {
  file: File
  preview?: string
  uploading?: boolean
  uploaded?: boolean
}

export function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [rateLimitWarning, setRateLimitWarning] = useState(false)
  const [showCannedResponses, setShowCannedResponses] = useState(false)
  const [shortcutQuery, setShortcutQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { uploadMultiple, uploading, progress, validateFile, getFileCategory } = useFileUpload()
  const { getByShortcut } = useCannedResponses()

  // Rate limiting - 10 messages per minute
  const { isRateLimited, remainingRequests, resetTime, checkAndRecord } = useMessageRateLimit(() => {
    setRateLimitWarning(true)
  })

  // Hide warning when no longer rate limited
  useEffect(() => {
    if (!isRateLimited && rateLimitWarning) {
      setRateLimitWarning(false)
    }
  }, [isRateLimited, rateLimitWarning])

  // Detect slash commands
  const handleMessageChange = useCallback((value: string) => {
    setMessage(value)
    onTyping?.()

    // Check for slash command
    const match = value.match(/^\/(\w*)$/)
    if (match) {
      setShortcutQuery(match[0])
      setShowCannedResponses(true)
    } else if (showCannedResponses && !value.startsWith('/')) {
      setShowCannedResponses(false)
      setShortcutQuery('')
    }

    // Check for exact shortcut match
    if (value.startsWith('/') && value.includes(' ') === false) {
      const response = getByShortcut(value)
      if (response) {
        setMessage(response.content)
        setShowCannedResponses(false)
        setShortcutQuery('')
      }
    }
  }, [onTyping, showCannedResponses, getByShortcut])

  // Handle canned response selection
  const handleCannedResponseSelect = useCallback((content: string) => {
    setMessage(content)
    setShowCannedResponses(false)
    setShortcutQuery('')
    textareaRef.current?.focus()
  }, [])

  // Auto-expand textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const maxHeight = 120 // ~5 lines
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview)
      })
    }
  }, [])

  // Process files (shared between file select and drag & drop)
  const processFiles = useCallback((files: File[]) => {
    setError('')

    const validFiles: PendingFile[] = []
    for (const file of files) {
      // Check for dangerous file types
      if (!isFileTypeSafe(file.name)) {
        setError('This file type is not allowed for security reasons')
        continue
      }

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }

      // Sanitize file name
      const sanitizedName = sanitizeFileName(file.name)
      const sanitizedFile = new File([file], sanitizedName, { type: file.type })

      const pending: PendingFile = { file: sanitizedFile }
      if (file.type.startsWith('image/')) {
        pending.preview = URL.createObjectURL(file)
      }
      validFiles.push(pending)
    }

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles])
    }
  }, [validateFile])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    processFiles(files)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  function removeFile(index: number) {
    setPendingFiles((prev) => {
      const updated = [...prev]
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() && pendingFiles.length === 0) return

    // Check rate limit
    if (!checkAndRecord()) {
      setError(`Too many messages. Please wait ${Math.ceil(resetTime / 1000)} seconds.`)
      return
    }

    setSending(true)
    setError('')

    let attachments: { file_name: string; file_url: string; file_type: string; file_size: number }[] = []

    // Upload files first
    if (pendingFiles.length > 0) {
      const { data, errors } = await uploadMultiple(pendingFiles.map((p) => p.file))
      if (errors.length > 0) {
        setError(errors.join(', '))
        setSending(false)
        return
      }
      attachments = data
    }

    // Sanitize message content before sending
    const sanitizedMessage = sanitizeInput(message.trim() || 'Sent attachments')
    const { error } = await onSend(sanitizedMessage, attachments)

    if (error) {
      setError(error.message)
    } else {
      setMessage('')
      pendingFiles.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview)
      })
      setPendingFiles([])
    }

    setSending(false)
  }

  function getFileIcon(type: string) {
    const category = getFileCategory(type)
    if (category === 'image') return Image
    if (category === 'video') return Film
    return FileText
  }

  const canSend = (message.trim() || pendingFiles.length > 0) && !sending && !uploading && !isRateLimited

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="p-4 relative"
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 bg-brand-500/10 border-2 border-dashed border-brand-500 rounded-xl flex items-center justify-center animate-in fade-in">
          <div className="text-center">
            <Upload className="w-10 h-10 text-brand-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-brand-400">Drop files here</p>
            <p className="text-xs text-text-muted mt-1">Images, videos, PDFs, documents</p>
          </div>
        </div>
      )}

      {/* Rate limit warning */}
      {rateLimitWarning && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-400">
            Slow down! {remainingRequests} messages remaining. Resets in {Math.ceil(resetTime / 1000)}s
          </p>
        </div>
      )}

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {pendingFiles.map((pending, index) => {
            const FileIcon = getFileIcon(pending.file.type)

            return (
              <div
                key={index}
                className="relative group bg-surface-light border border-border rounded-lg overflow-hidden transition-all hover:border-white/20"
              >
                {pending.preview ? (
                  <img
                    src={pending.preview}
                    alt={pending.file.name}
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 flex flex-col items-center justify-center p-2">
                    <FileIcon className="w-6 h-6 text-text-secondary mb-1" />
                    <p className="text-xs text-text-muted truncate w-full text-center">
                      {pending.file.name.split('.').pop()}
                    </p>
                  </div>
                )}

                {/* Upload progress overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                    <span className="text-xs text-white font-medium">{progress}%</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${pending.file.name}`}
                  disabled={uploading}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 disabled:cursor-not-allowed"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 mb-2" role="alert">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Attach files"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach files"
          className="p-2.5 text-text-secondary hover:text-white rounded-lg hover:bg-surface-light transition-colors flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowCannedResponses(!showCannedResponses)}
          aria-label="Canned responses"
          title="Quick responses (or type /)"
          className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
            showCannedResponses
              ? 'text-brand-400 bg-brand-500/10'
              : 'text-text-secondary hover:text-white hover:bg-surface-light'
          }`}
        >
          <Zap className="w-5 h-5" />
        </button>
        <div className="flex-1 relative">
          {/* Canned responses picker - fixed overlay on mobile, absolute on desktop */}
          {showCannedResponses && (
            <>
              {/* Mobile: fixed bottom overlay */}
              <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 p-3 bg-background/95 backdrop-blur-sm border-t border-border safe-area-inset-bottom animate-in slide-in-from-bottom">
                <CannedResponsesPicker
                  onSelect={handleCannedResponseSelect}
                  onClose={() => setShowCannedResponses(false)}
                  searchQuery={shortcutQuery.replace('/', '')}
                />
              </div>
              {/* Mobile backdrop */}
              <div
                className="sm:hidden fixed inset-0 z-40 bg-black/50"
                onClick={() => setShowCannedResponses(false)}
              />
              {/* Desktop: absolute positioned above input */}
              <div className="hidden sm:block absolute bottom-full left-0 right-0 mb-2 z-10">
                <CannedResponsesPicker
                  onSelect={handleCannedResponseSelect}
                  onClose={() => setShowCannedResponses(false)}
                  searchQuery={shortcutQuery.replace('/', '')}
                />
              </div>
            </>
          )}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder="Type your message... (/ for quick responses)"
            rows={1}
            aria-label="Message"
            className="w-full px-4 py-2.5 pr-20 bg-surface-light border border-border rounded-lg text-white placeholder:text-text-muted resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            style={{ minHeight: '44px' }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && showCannedResponses) {
                e.preventDefault()
                setShowCannedResponses(false)
              } else if (e.key === 'Enter' && !e.shiftKey && !showCannedResponses) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <span className="absolute right-12 bottom-3.5 text-[10px] text-text-muted pointer-events-none hidden sm:block">
            Enter ↵
          </span>
        </div>
        <Button
          type="submit"
          disabled={!canSend}
          loading={sending || uploading}
          aria-label="Send message"
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  )
}
