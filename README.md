# ShipBee Support

A customer support widget system with an embeddable chat widget and admin dashboard for ticket management.

## Features

### Customer Widget
- Floating chat button with unread count badge
- Submit support tickets through a chat interface
- View previous tickets and conversations
- Upload attachments (images, videos, documents)
- Real-time message updates
- Ticket status visibility

### Admin Dashboard
- View all tickets with filtering and search
- Reply to customer messages
- **@mentions** - Mention support agents or customers in messages
- **Canned responses** - Quick replies with `/` shortcuts
- **Typing indicators** - See when others are typing
- **Message reactions** - React to messages with emojis
- Update ticket status (open, pending, resolved, closed)
- View attachments inline with image lightbox
- Real-time updates when new tickets/messages arrive
- **Keyboard shortcuts** - Quick navigation (press `?` to view)
- **Theme toggle** - Light/dark mode support
- **Sound notifications** - Audio alerts for new messages
- **Mobile optimized** - Swipe gestures, responsive design

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Icons**: Lucide React

## Database ERD

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│    profiles     │          │     tickets     │          │    messages     │
├─────────────────┤          ├─────────────────┤          ├─────────────────┤
│ id (PK, FK)     │─────────<│ id (PK)         │─────────<│ id (PK)         │
│ email           │          │ customer_id(FK) │>─────────│ ticket_id (FK)  │
│ full_name       │          │ subject         │          │ sender_id (FK)  │>───┐
│ avatar_url      │          │ status          │          │ content         │    │
│ role            │          │ priority        │          │ created_at      │    │
│ created_at      │<────────<│ assigned_to(FK) │          └────────┬────────┘    │
└─────────────────┘          │ created_at      │                   │             │
        │                    │ updated_at      │                   │             │
        │                    └─────────────────┘                   │             │
        │                                                          │             │
        └──────────────────────────────────────────────────────────┴─────────────┘
                                                                   │
                                                     ┌─────────────┴───────────┐
                                                     │      attachments        │
                                                     ├─────────────────────────┤
                                                     │ id (PK)                 │
                                                     │ message_id (FK)         │>
                                                     │ file_name               │
                                                     │ file_url                │
                                                     │ file_type               │
                                                     │ file_size               │
                                                     │ created_at              │
                                                     └─────────────────────────┘

ENUMS:
- user_role: 'customer' | 'admin'
- ticket_status: 'open' | 'pending' | 'resolved' | 'closed'
- ticket_priority: 'low' | 'medium' | 'high' | 'urgent'
```

## Project Structure

```
src/
├── components/
│   ├── ui/                    # Base UI components (Button, Input, Badge, etc.)
│   ├── admin/                 # Admin dashboard components
│   │   ├── StatsCards.tsx     # Dashboard statistics
│   │   ├── Filters.tsx        # Search and filter controls
│   │   ├── TicketList.tsx     # Ticket list view
│   │   ├── TicketDetail.tsx   # Selected ticket detail view
│   │   ├── MessageThread.tsx  # Message display with mentions
│   │   ├── MessageInput.tsx   # Message composer with file upload
│   │   ├── MentionPicker.tsx  # @mention user dropdown
│   │   ├── MessageReactions.tsx # Emoji reactions
│   │   └── CannedResponsesPicker.tsx # Quick reply selector
│   └── widget/                # Customer widget components
│       ├── ChatWidget.tsx     # Main widget container
│       ├── WidgetButton.tsx   # Floating toggle button
│       ├── WidgetPanel.tsx    # Widget panel content
│       ├── WidgetLogin.tsx    # Auth form for widget
│       ├── TicketList.tsx     # Customer's ticket list
│       ├── TicketChat.tsx     # Conversation view
│       └── NewTicketForm.tsx  # Create new ticket form
├── hooks/
│   ├── useAuth.ts             # Authentication state and methods
│   ├── useTickets.ts          # Ticket CRUD and realtime
│   ├── useAdminStats.ts       # Dashboard statistics
│   ├── useFileUpload.ts       # File upload to Supabase Storage
│   ├── useMentionableUsers.ts # @mention user fetching
│   ├── useTypingIndicator.ts  # Real-time typing status
│   ├── useReactions.ts        # Message reactions
│   ├── useCannedResponses.ts  # Quick reply templates
│   └── useRateLimit.ts        # Message rate limiting
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── utils.ts               # Utility functions
├── pages/
│   ├── Login.tsx              # Login page
│   ├── AdminDashboard.tsx     # Admin interface
│   └── WidgetDemo.tsx         # Demo page with embedded widget
├── types/
│   └── database.ts            # TypeScript types
└── App.tsx                    # Routes and app setup

supabase/
├── migrations/
│   └── 001_initial_schema.sql # Full database schema, RLS, RPCs
└── functions/
    └── on-ticket-created/     # Edge function for ticket notifications
```

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd shipbee-test
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Settings > API** and copy your project URL and anon key
4. Enable **Email** provider in **Authentication > Providers**
5. Set **Site URL** to `http://localhost:5173` in **Authentication > URL Configuration**
6. Create a storage bucket named `attachments` in **Storage**

### 3. Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

## Supabase RPCs

### `search_tickets(search_term, status_filter, priority_filter)`
Search and filter tickets. Returns tickets with customer profiles.

### `get_ticket_details(p_ticket_id)`
Get a single ticket with all messages, attachments, and related profiles.

### `get_admin_stats()`
Get dashboard statistics (total, open, pending, resolved today).

## Edge Functions

### `on-ticket-created`
Triggered when a new ticket is created:
- Logs notification details
- Auto-assigns ticket to admin with least open tickets

## Authentication

Uses Supabase Magic Link (passwordless email) authentication.

- **Customers**: Can only see and manage their own tickets
- **Admins**: Can see all tickets, reply, and change status

To create an admin user, update the `role` field in the `profiles` table:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

## License

MIT
