import { useState, useCallback, useEffect } from 'react'

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface ReactionsState {
  [messageId: string]: Reaction[]
}

const STORAGE_KEY = 'message_reactions'

export function useReactions() {
  const [reactions, setReactions] = useState<ReactionsState>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reactions))
    } catch {
      // Ignore storage errors
    }
  }, [reactions])

  const getReactions = useCallback((messageId: string): Reaction[] => {
    return reactions[messageId] || []
  }, [reactions])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setReactions((prev) => {
      const messageReactions = prev[messageId] || []
      const existing = messageReactions.find((r) => r.emoji === emoji)

      if (existing) {
        if (existing.userReacted) return prev // Already reacted

        return {
          ...prev,
          [messageId]: messageReactions.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, userReacted: true }
              : r
          ),
        }
      }

      return {
        ...prev,
        [messageId]: [...messageReactions, { emoji, count: 1, userReacted: true }],
      }
    })
  }, [])

  const removeReaction = useCallback((messageId: string, emoji: string) => {
    setReactions((prev) => {
      const messageReactions = prev[messageId] || []
      const existing = messageReactions.find((r) => r.emoji === emoji)

      if (!existing || !existing.userReacted) return prev

      if (existing.count === 1) {
        return {
          ...prev,
          [messageId]: messageReactions.filter((r) => r.emoji !== emoji),
        }
      }

      return {
        ...prev,
        [messageId]: messageReactions.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.count - 1, userReacted: false }
            : r
        ),
      }
    })
  }, [])

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    const messageReactions = reactions[messageId] || []
    const existing = messageReactions.find((r) => r.emoji === emoji)

    if (existing?.userReacted) {
      removeReaction(messageId, emoji)
    } else {
      addReaction(messageId, emoji)
    }
  }, [reactions, addReaction, removeReaction])

  return {
    reactions,
    getReactions,
    addReaction,
    removeReaction,
    toggleReaction,
  }
}
