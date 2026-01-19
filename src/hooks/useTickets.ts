import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { TicketWithCustomer, TicketStatus, TicketPriority, TicketWithDetails, Ticket, Message, Profile } from '../types/database'

const PAGE_SIZE = 20

interface UseTicketsOptions {
  searchTerm?: string
  statusFilter?: TicketStatus[]
  priorityFilter?: TicketPriority[]
}

export function useTickets(options: UseTicketsOptions = {}) {
  const [tickets, setTickets] = useState<TicketWithCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const fetchTickets = useCallback(async (pageNum = 0, append = false) => {
    if (pageNum === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      const { data, error: fetchError } = await supabase.rpc('search_tickets', {
        search_term: options.searchTerm || '',
        status_filter: options.statusFilter || null,
        priority_filter: options.priorityFilter || null,
      })

      if (fetchError) {
        setError(fetchError.message)
        if (!append) setTickets([])
      } else {
        const allTickets = (data as TicketWithCustomer[]) || []
        // Client-side pagination since RPC doesn't support it yet
        const startIndex = pageNum * PAGE_SIZE
        const endIndex = startIndex + PAGE_SIZE
        const pageTickets = allTickets.slice(startIndex, endIndex)

        if (append) {
          setTickets((prev) => [...prev, ...pageTickets])
        } else {
          setTickets(allTickets.slice(0, PAGE_SIZE))
        }
        setHasMore(endIndex < allTickets.length)
        setPage(pageNum)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [options.searchTerm, options.statusFilter, options.priorityFilter])

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0)
    fetchTickets(0, false)
  }, [fetchTickets])

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchTickets(page + 1, true)
    }
  }, [fetchTickets, loadingMore, hasMore, page])

  // Subscribe to realtime updates for tickets AND messages
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          // Refresh from the beginning when tickets change
          fetchTickets(0, false)
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          // Refresh when new messages arrive to update unread counts
          fetchTickets(0, false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTickets])

  return { tickets, loading, loadingMore, error, hasMore, loadMore, refetch: () => fetchTickets(0, false) }
}

interface UseTicketDetailsOptions {
  profile?: Profile | null
  onMarkAsRead?: () => void
}

export function useTicketDetails(ticketId: string | null, options: UseTicketDetailsOptions = {}) {
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(async (silent = false) => {
    if (!ticketId) {
      setTicket(null)
      return
    }

    // Only show loading indicator on initial load, not on refreshes
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    const { data, error: fetchError } = await supabase.rpc('get_ticket_details', {
      p_ticket_id: ticketId,
    })

    if (fetchError) {
      setError(fetchError.message)
      setTicket(null)
    } else {
      setTicket(data as TicketWithDetails)
    }

    if (!silent) {
      setLoading(false)
    }
  }, [ticketId])

  // Mark ticket as read when it's viewed
  const markAsRead = useCallback(async () => {
    if (!ticketId) return

    // Call RPC to mark messages as read (clears unread_count)
    await supabase.rpc('mark_ticket_read', { p_ticket_id: ticketId })

    // Notify parent to refresh ticket list
    options.onMarkAsRead?.()
  }, [ticketId, options])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  // Mark as read when ticket is loaded
  useEffect(() => {
    if (ticket && ticketId) {
      markAsRead()
    }
  }, [ticket?.id]) // Only run when ticket ID changes, not on every ticket update

  // Subscribe to messages for this ticket
  useEffect(() => {
    if (!ticketId) return

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          // Silent refresh - don't show loading since we may have optimistic data
          fetchTicket(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId, fetchTicket])

  async function updateStatus(status: TicketStatus) {
    if (!ticketId || !ticket) return { error: new Error('No ticket selected') }

    const previousStatus = ticket.status

    // Optimistic update - update UI immediately
    setTicket((prev) => {
      if (!prev) return prev
      return { ...prev, status }
    })

    const { error } = await supabase
      .from('tickets')
      .update({ status } as Partial<Ticket>)
      .eq('id', ticketId)

    if (error) {
      // Rollback on error
      setTicket((prev) => {
        if (!prev) return prev
        return { ...prev, status: previousStatus }
      })
    }

    return { error }
  }

  async function sendMessage(content: string, attachments?: { file_name: string; file_url: string; file_type: string; file_size: number }[]) {
    if (!ticketId) return { error: new Error('No ticket selected') }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }

    // Use profile from options for optimistic update, fallback to basic info
    const senderProfile = options.profile

    // Optimistic update - add message immediately to UI
    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage = {
      id: optimisticId,
      ticket_id: ticketId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        email: senderProfile?.email || user.email || '',
        full_name: senderProfile?.full_name || 'You',
        avatar_url: senderProfile?.avatar_url || null,
        role: senderProfile?.role || 'admin' as const,
        created_at: senderProfile?.created_at || '',
      },
      attachments: attachments?.map((att, idx) => ({
        id: `optimistic-att-${idx}`,
        message_id: optimisticId,
        ...att,
        created_at: new Date().toISOString(),
      })) || [],
    }

    // Add optimistic message to ticket
    setTicket((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        messages: [...prev.messages, optimisticMessage],
      }
    })

    // Use RPC for rate limiting and server-side validation
    const { data: message, error: messageError } = await supabase
      .rpc('send_message', {
        p_ticket_id: ticketId,
        p_content: content,
      })

    if (messageError) {
      // Rollback optimistic update on error
      setTicket((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.filter((m) => m.id !== optimisticId),
        }
      })
      return { error: messageError }
    }

    // Add attachments if any
    if (attachments && attachments.length > 0 && message) {
      const messageData = message as { id: string }
      await supabase.from('attachments').insert(
        attachments.map((att) => ({
          message_id: messageData.id,
          ...att,
        }))
      )
    }

    // Silent refresh to get the real message with correct ID (optimistic data is already shown)
    fetchTicket(true)
    return { error: null }
  }

  return { ticket, loading, error, refetch: fetchTicket, updateStatus, sendMessage, markAsRead }
}

export function useCreateTicket() {
  const [loading, setLoading] = useState(false)

  async function createTicket(subject: string, message: string, priority: TicketPriority = 'medium') {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return { error: new Error('Not authenticated'), ticketId: null }
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        customer_id: user.id,
        subject,
        priority,
      } as Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'status' | 'assigned_to'>)
      .select()
      .single()

    if (ticketError || !ticket) {
      setLoading(false)
      return { error: ticketError, ticketId: null }
    }

    const ticketData = ticket as Ticket

    // Create initial message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        ticket_id: ticketData.id,
        sender_id: user.id,
        content: message,
      } as Omit<Message, 'id' | 'created_at'>)

    setLoading(false)
    return { error: messageError, ticketId: ticketData.id }
  }

  return { createTicket, loading }
}
