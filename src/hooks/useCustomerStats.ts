import { useMemo } from 'react'
import type { TicketWithCustomer, CustomerStats } from '../types/database'

export function useCustomerStats(tickets: TicketWithCustomer[], loading: boolean) {
  const stats = useMemo<CustomerStats | null>(() => {
    if (loading || !tickets) return null

    return {
      total_tickets: tickets.length,
      open_tickets: tickets.filter((t) => t.status === 'open').length,
      pending_tickets: tickets.filter((t) => t.status === 'pending').length,
      resolved_tickets: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    }
  }, [tickets, loading])

  return { stats, loading }
}
