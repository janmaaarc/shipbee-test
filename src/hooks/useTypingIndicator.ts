import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface TypingUser {
  id: string
  name: string
}

interface UseTypingIndicatorOptions {
  ticketId: string | null
  profile: Profile | null
}

export function useTypingIndicator({ ticketId, profile }: UseTypingIndicatorOptions) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  // Track auto-remove timeouts by user ID to prevent memory leaks
  const userTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Broadcast that user is typing
  const setTyping = useCallback((isTyping: boolean) => {
    if (!ticketId || !profile || !channelRef.current) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: profile.id,
        user_name: profile.full_name || 'Someone',
        is_typing: isTyping,
      },
    })
  }, [ticketId, profile])

  // Debounced typing indicator - auto-clears after 2 seconds of no input
  const onTyping = useCallback(() => {
    setTyping(true)

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
    }, 2000)
  }, [setTyping])

  // Stop typing indicator immediately (e.g., when message is sent)
  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setTyping(false)
  }, [setTyping])

  // Subscribe to typing events
  useEffect(() => {
    if (!ticketId || !profile) {
      setTypingUsers([])
      return
    }

    const channel = supabase.channel(`typing-${ticketId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.user_id === profile.id) return

        if (payload.is_typing) {
          setTypingUsers((prev) => {
            // Add user if not already in list
            if (prev.some((u) => u.id === payload.user_id)) return prev
            return [...prev, { id: payload.user_id, name: payload.user_name }]
          })

          // Clear existing timeout for this user
          const existingTimeout = userTimeoutsRef.current.get(payload.user_id)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
          }

          // Auto-remove after 3 seconds if no update
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.id !== payload.user_id))
            userTimeoutsRef.current.delete(payload.user_id)
          }, 3000)
          userTimeoutsRef.current.set(payload.user_id, timeout)
        } else {
          // Clear timeout and remove user from typing list
          const existingTimeout = userTimeoutsRef.current.get(payload.user_id)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            userTimeoutsRef.current.delete(payload.user_id)
          }
          setTypingUsers((prev) => prev.filter((u) => u.id !== payload.user_id))
        }
      })
      .subscribe()

    return () => {
      // Clear all timeouts on cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      userTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      userTimeoutsRef.current.clear()
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [ticketId, profile])

  return {
    typingUsers,
    onTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
  }
}
