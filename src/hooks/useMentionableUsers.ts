import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

export interface MentionableUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'admin' | 'customer'
}

interface UseMentionableUsersOptions {
  customer?: Profile | null
}

export function useMentionableUsers(options: UseMentionableUsersOptions = {}) {
  const { customer } = options
  const [admins, setAdmins] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdmins() {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('full_name')

      if (!error && data) {
        setAdmins(data)
      }
      setLoading(false)
    }

    fetchAdmins()
  }, [])

  const users = useMemo<MentionableUser[]>(() => {
    const result: MentionableUser[] = []

    // Add admins first (for @support mentions)
    admins.forEach((admin) => {
      result.push({
        id: admin.id,
        name: admin.full_name || admin.email.split('@')[0],
        email: admin.email,
        avatar_url: admin.avatar_url,
        role: 'admin',
      })
    })

    // Add customer if provided
    if (customer) {
      result.push({
        id: customer.id,
        name: customer.full_name || customer.email.split('@')[0],
        email: customer.email,
        avatar_url: customer.avatar_url,
        role: 'customer',
      })
    }

    return result
  }, [admins, customer])

  // Filter users by search query
  const filterUsers = (query: string): MentionableUser[] => {
    if (!query) return users
    const lowerQuery = query.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    )
  }

  return {
    users,
    filterUsers,
    loading,
  }
}
