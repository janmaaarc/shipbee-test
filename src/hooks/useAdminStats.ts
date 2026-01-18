import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AdminStats } from '../types/database'

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase.rpc('get_admin_stats')

    if (fetchError) {
      setError(fetchError.message)
      setStats(null)
    } else {
      setStats(data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Refresh stats when tickets change
  useEffect(() => {
    const channel = supabase
      .channel('stats-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          fetchStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
