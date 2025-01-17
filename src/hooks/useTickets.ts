import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { TicketStatus, TicketWithDetails, TicketStats } from '@/types/database'

export function useTickets(statusFilter?: TicketStatus[]) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('search_tickets', {
        search_term: '',
        status_filter: statusFilter || null,
      })

      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          fetchTickets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTickets])

  return { tickets, loading, error, refetch: fetchTickets }
}

export function useTicketDetails(ticketId: string | null) {
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(async () => {
    if (!ticketId) {
      setTicket(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_ticket_details', {
        p_ticket_id: ticketId,
      })

      if (error) throw error
      setTicket(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  // Real-time for messages
  useEffect(() => {
    if (!ticketId) return

    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${ticketId}` },
        () => {
          fetchTicket()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId, fetchTicket])

  return { ticket, loading, error, refetch: fetchTicket }
}

export function useTicketStats() {
  const [stats, setStats] = useState<TicketStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data } = await supabase.rpc('get_admin_stats')
      setStats(data)
      setLoading(false)
    }
    fetchStats()
  }, [])

  return { stats, loading }
}

export async function createTicket(customerId: string, subject: string, initialMessage: string) {
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({ customer_id: customerId, subject })
    .select()
    .single()

  if (ticketError) throw ticketError

  const { error: messageError } = await supabase
    .from('messages')
    .insert({ ticket_id: ticket.id, sender_id: customerId, content: initialMessage })

  if (messageError) throw messageError

  return ticket
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) throw error
}

export async function sendMessage(ticketId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ ticket_id: ticketId, sender_id: senderId, content })
    .select()
    .single()

  if (error) throw error
  return data
}
