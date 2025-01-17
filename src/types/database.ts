export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type UserRole = 'customer' | 'admin'

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
export interface TicketWithDetails extends Ticket {
  customer: Profile
  assigned_agent: Profile | null
  messages: MessageWithSender[]
  last_message?: Message
  unread_count?: number
}

export interface MessageWithSender extends Message {
  sender: Profile
  attachments: Attachment[]
}

// API response types
export interface TicketStats {
  total: number
  open: number
  pending: number
  resolved: number
  closed: number
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Ticket, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Message, 'id'>>
      }
      attachments: {
        Row: Attachment
        Insert: Omit<Attachment, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Attachment, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_ticket_details: {
        Args: { p_ticket_id: string }
        Returns: TicketWithDetails
      }
      get_admin_stats: {
        Args: Record<string, never>
        Returns: TicketStats
      }
      search_tickets: {
        Args: {
          search_term: string
          status_filter: TicketStatus[] | null
        }
        Returns: TicketWithDetails[]
      }
    }
    Enums: {
      ticket_status: TicketStatus
      ticket_priority: TicketPriority
      user_role: UserRole
    }
  }
}
