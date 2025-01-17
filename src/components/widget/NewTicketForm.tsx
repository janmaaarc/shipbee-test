import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createTicket } from '@/hooks/useTickets'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface NewTicketFormProps {
  onSuccess: (ticketId: string) => void
  onCancel: () => void
}

export function NewTicketForm({ onSuccess, onCancel }: NewTicketFormProps) {
  const { user } = useAuth()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !subject.trim() || !message.trim()) return

    setLoading(true)
    setError(null)

    try {
      const ticket = await createTicket(user.id, subject, message)
      onSuccess(ticket.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 h-full flex flex-col">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Subject
        </label>
        <Input
          type="text"
          placeholder="What do you need help with?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Message
        </label>
        <textarea
          placeholder="Describe your issue or question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !subject.trim() || !message.trim()}
          className="flex-1"
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </form>
  )
}
