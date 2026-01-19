export type UserRole = 'customer' | 'admin'
export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Ticket {
  id: string
  customer_id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  ticket_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Attachment {
  id: string
  message_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}

// Extended types with relations
export interface TicketWithCustomer extends Ticket {
  customer: Profile
  unread_count?: number
  last_message_at?: string
  last_message?: string // Preview of the last message content
}

export interface TicketWithDetails extends Ticket {
  customer: Profile
  assigned_admin: Profile | null
  messages: MessageWithSender[]
}

export interface MessageWithSender extends Message {
  sender: Profile
  attachments: Attachment[]
}

// RPC response types
export interface AdminStats {
  total_tickets: number
  open_tickets: number
  pending_tickets: number
  resolved_today: number
}

export interface CustomerStats {
  total_tickets: number
  open_tickets: number
  pending_tickets: number
  resolved_tickets: number
}

// Canned responses
export interface CannedResponse {
  id: string
  title: string
  content: string
  shortcut?: string
  category?: string
  created_at: string
  updated_at: string
}
