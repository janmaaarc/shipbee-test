import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Smile } from 'lucide-react'
import { cn } from '../../lib/utils'

// Common reactions
const REACTION_EMOJIS = ['👍', '❤️', '😊', '🎉', '👀', '🙏', '✅', '🔥']

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface MessageReactionsProps {
  reactions: Reaction[]
  onReact: (emoji: string) => void
  onRemoveReaction: (emoji: string) => void
  className?: string
}

export function MessageReactions({
  reactions,
  onReact,
  onRemoveReaction,
  className,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [pickerPosition, setPickerPosition] = useState<{ top?: string; bottom?: string; left?: string; right?: string; transform?: string }>({
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  const handleReactionClick = useCallback((emoji: string, userReacted: boolean) => {
    if (userReacted) {
      onRemoveReaction(emoji)
    } else {
      onReact(emoji)
    }
  }, [onReact, onRemoveReaction])

  const handleAddReaction = useCallback((emoji: string) => {
    onReact(emoji)
    setShowPicker(false)
  }, [onReact])

  // Calculate picker position to stay within viewport
  useEffect(() => {
    if (showPicker && buttonRef.current && pickerRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const pickerRect = pickerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const padding = 8

      const position: { top?: string; bottom?: string; left?: string; right?: string; transform?: string } = {}

      // Vertical positioning - prefer above, fallback to below
      if (buttonRect.top - pickerRect.height - padding > 0) {
        position.bottom = '100%'
      } else {
        position.top = '100%'
      }

      // Horizontal positioning - center by default, adjust if overflow
      const pickerCenterLeft = buttonRect.left + buttonRect.width / 2 - pickerRect.width / 2

      if (pickerCenterLeft < padding) {
        // Would overflow left - align to left edge
        position.left = '0'
        position.transform = undefined
      } else if (pickerCenterLeft + pickerRect.width > viewportWidth - padding) {
        // Would overflow right - align to right edge
        position.right = '0'
        position.transform = undefined
      } else {
        // Center it
        position.left = '50%'
        position.transform = 'translateX(-50%)'
      }

      setPickerPosition(position)
    }
  }, [showPicker])

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji, reaction.userReacted)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all',
            reaction.userReacted
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
              : 'bg-surface-light text-text-secondary hover:bg-surface-light/80 border border-transparent hover:border-border'
          )}
        >
          <span>{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            'p-1 rounded-full transition-all',
            showPicker
              ? 'bg-brand-500/20 text-brand-400'
              : 'text-text-muted hover:text-white hover:bg-surface-light'
          )}
          aria-label="Add reaction"
        >
          {showPicker ? <Smile className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowPicker(false)}
            />

            {/* Picker */}
            <div
              ref={pickerRef}
              className={cn(
                'absolute z-20 p-2 bg-surface border border-border rounded-lg shadow-xl animate-in zoom-in-95 fade-in',
                pickerPosition.bottom ? 'mb-1' : 'mt-1'
              )}
              style={{
                top: pickerPosition.top,
                bottom: pickerPosition.bottom,
                left: pickerPosition.left,
                right: pickerPosition.right,
                transform: pickerPosition.transform,
              }}
            >
              <div className="flex gap-1">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(emoji)}
                    className="p-1.5 text-lg hover:bg-surface-light rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Hook for managing reactions state (would normally integrate with backend)
export function useMessageReactions(_messageId: string) {
  const [reactions, setReactions] = useState<Reaction[]>([])

  const addReaction = useCallback((emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji)
      if (existing) {
        return prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count + 1, userReacted: true }
            : r
        )
      }
      return [...prev, { emoji, count: 1, userReacted: true }]
    })
  }, [])

  const removeReaction = useCallback((emoji: string) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji)
      if (existing && existing.count === 1) {
        return prev.filter((r) => r.emoji !== emoji)
      }
      return prev.map((r) =>
        r.emoji === emoji
          ? { ...r, count: r.count - 1, userReacted: false }
          : r
      )
    })
  }, [])

  return {
    reactions,
    addReaction,
    removeReaction,
  }
}
