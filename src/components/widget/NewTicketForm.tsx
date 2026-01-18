import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { useCreateTicket } from '../../hooks/useTickets'
import { useToast } from '../ui/Toast'

interface NewTicketFormProps {
  onSuccess: (ticketId: string) => void
  onCancel: () => void
}

export function NewTicketForm({ onSuccess, onCancel }: NewTicketFormProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { createTicket, loading } = useCreateTicket()
  const { addToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields')
      return
    }

    const { error, ticketId } = await createTicket(subject, message)

    if (error) {
      setError(error.message)
      addToast('error', 'Failed to create ticket')
    } else if (ticketId) {
      addToast('success', 'Ticket created successfully')
      onSuccess(ticketId)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 h-full overflow-y-auto">
      <Input
        label="Subject"
        placeholder="What do you need help with?"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        aria-describedby={error ? 'form-error' : undefined}
      />

      <Textarea
        label="Message"
        placeholder="Describe your issue in detail..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
      />

      {error && (
        <p id="form-error" className="text-sm text-red-400" role="alert">{error}</p>
      )}

      <div className="flex gap-2 pt-2">
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
          loading={loading}
          className="flex-1"
        >
          <Send className="w-4 h-4 mr-1.5" />
          Submit
        </Button>
      </div>
    </form>
  )
}
