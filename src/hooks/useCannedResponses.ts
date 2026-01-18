import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CannedResponse } from '../types/database'

// Default canned responses for when DB is empty
const DEFAULT_RESPONSES: Omit<CannedResponse, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    title: 'Greeting',
    content: 'Hi there! Thanks for reaching out. How can I help you today?',
    shortcut: '/hi',
    category: 'General',
  },
  {
    title: 'Request More Info',
    content: 'Could you please provide more details about your issue? This will help us assist you better.',
    shortcut: '/more',
    category: 'General',
  },
  {
    title: 'Order Status',
    content: "I'd be happy to help you check your order status. Could you please provide your order number?",
    shortcut: '/order',
    category: 'Orders',
  },
  {
    title: 'Refund Process',
    content: "I understand you'd like a refund. I've initiated the refund process for you. Please allow 5-7 business days for the amount to reflect in your account.",
    shortcut: '/refund',
    category: 'Orders',
  },
  {
    title: 'Shipping Info',
    content: 'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 business day delivery.',
    shortcut: '/ship',
    category: 'Shipping',
  },
  {
    title: 'Thank You',
    content: "Thank you for contacting us! Is there anything else I can help you with?",
    shortcut: '/thanks',
    category: 'General',
  },
  {
    title: 'Closing',
    content: "Thank you for reaching out! If you have any more questions, don't hesitate to contact us. Have a great day!",
    shortcut: '/close',
    category: 'General',
  },
  {
    title: 'Escalation',
    content: "I understand this is a complex issue. I'm escalating this to our senior support team who will get back to you within 24 hours.",
    shortcut: '/escalate',
    category: 'General',
  },
]

interface UseCannedResponsesReturn {
  responses: CannedResponse[]
  categories: string[]
  loading: boolean
  error: string | null
  addResponse: (response: Omit<CannedResponse, 'id' | 'created_at' | 'updated_at'>) => Promise<{ error: Error | null }>
  updateResponse: (id: string, updates: Partial<CannedResponse>) => Promise<{ error: Error | null }>
  deleteResponse: (id: string) => Promise<{ error: Error | null }>
  searchResponses: (query: string) => CannedResponse[]
  getByShortcut: (shortcut: string) => CannedResponse | undefined
}

export function useCannedResponses(): UseCannedResponsesReturn {
  const [responses, setResponses] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load responses from localStorage or use defaults (Supabase integration can be added later)
  useEffect(() => {
    const loadResponses = () => {
      try {
        const stored = localStorage.getItem('canned_responses')
        if (stored) {
          setResponses(JSON.parse(stored))
        } else {
          // Initialize with default responses
          const initialResponses: CannedResponse[] = DEFAULT_RESPONSES.map((r, i) => ({
            ...r,
            id: `default-${i}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
          setResponses(initialResponses)
          localStorage.setItem('canned_responses', JSON.stringify(initialResponses))
        }
      } catch (err) {
        setError('Failed to load canned responses')
      } finally {
        setLoading(false)
      }
    }

    loadResponses()
  }, [])

  // Save to localStorage whenever responses change
  useEffect(() => {
    if (!loading && responses.length > 0) {
      localStorage.setItem('canned_responses', JSON.stringify(responses))
    }
  }, [responses, loading])

  const categories = [...new Set(responses.map(r => r.category).filter(Boolean) as string[])]

  const addResponse = useCallback(async (
    response: Omit<CannedResponse, 'id' | 'created_at' | 'updated_at'>
  ): Promise<{ error: Error | null }> => {
    try {
      const newResponse: CannedResponse = {
        ...response,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setResponses(prev => [...prev, newResponse])
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const updateResponse = useCallback(async (
    id: string,
    updates: Partial<CannedResponse>
  ): Promise<{ error: Error | null }> => {
    try {
      setResponses(prev => prev.map(r =>
        r.id === id
          ? { ...r, ...updates, updated_at: new Date().toISOString() }
          : r
      ))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const deleteResponse = useCallback(async (id: string): Promise<{ error: Error | null }> => {
    try {
      setResponses(prev => prev.filter(r => r.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }, [])

  const searchResponses = useCallback((query: string): CannedResponse[] => {
    const lowerQuery = query.toLowerCase()
    return responses.filter(r =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.content.toLowerCase().includes(lowerQuery) ||
      r.shortcut?.toLowerCase().includes(lowerQuery) ||
      r.category?.toLowerCase().includes(lowerQuery)
    )
  }, [responses])

  const getByShortcut = useCallback((shortcut: string): CannedResponse | undefined => {
    return responses.find(r => r.shortcut === shortcut)
  }, [responses])

  return {
    responses,
    categories,
    loading,
    error,
    addResponse,
    updateResponse,
    deleteResponse,
    searchResponses,
    getByShortcut,
  }
}
