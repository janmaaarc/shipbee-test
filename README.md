# ShipBee Support

A customer support widget system with real-time messaging, file attachments, and ticket management.

## Features

### Customer Widget
- Embeddable chat-style interface
- Create and track support tickets
- Send messages with file attachments (images, videos, documents)
- View ticket status and history
- Real-time message updates

### Admin Dashboard
- View all tickets with filtering and search
- Reply to customer messages
- Update ticket status (open, pending, resolved, closed)
- View attached files
- Real-time updates when new messages arrive
- Dashboard statistics

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Icons**: Lucide React

## Database Schema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │     │     tickets     │     │    messages     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK, FK)     │────<│ id (PK)         │────<│ id (PK)         │
│ email           │     │ customer_id(FK) │     │ ticket_id (FK)  │
│ full_name       │     │ subject         │     │ sender_id (FK)  │
│ avatar_url      │     │ status          │     │ content         │
│ role            │     │ priority        │     │ created_at      │
│ created_at      │     │ assigned_to(FK) │     └─────────────────┘
└─────────────────┘     │ created_at      │              │
                        │ updated_at      │              │
                        └─────────────────┘              │
                                                         │
                        ┌─────────────────┐              │
                        │   attachments   │<─────────────┘
                        ├─────────────────┤
                        │ id (PK)         │
                        │ message_id (FK) │
                        │ file_name       │
                        │ file_url        │
                        │ file_type       │
                        │ file_size       │
                        │ created_at      │
                        └─────────────────┘
```

### Enums
- **ticket_status**: `open`, `pending`, `resolved`, `closed`
- **ticket_priority**: `low`, `medium`, `high`, `urgent`
- **user_role**: `customer`, `admin`

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Run Database Migration

1. Open SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL to create tables, functions, and policies

### 3. Configure Storage

1. Go to Storage in your Supabase dashboard
2. The migration script creates an `attachments` bucket automatically
3. If it doesn't exist, create a new bucket named `attachments` with:
   - Public: false
   - File size limit: 10MB (10485760 bytes)

### 4. Enable Realtime

1. Go to Database > Replication
2. Enable realtime for `tickets` and `messages` tables

### 5. Create Admin User

After signing up as a user, run this SQL to make yourself an admin:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 6. Deploy Edge Functions (Optional)

```bash
supabase functions deploy notify-ticket
```

Then set up a database webhook to trigger on ticket inserts/updates.

## Local Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd shipbee-test
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under Settings > API.

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard components
│   │   ├── Filters.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageThread.tsx
│   │   ├── StatsCards.tsx
│   │   ├── TicketDetail.tsx
│   │   └── TicketList.tsx
│   ├── ui/             # Reusable UI components
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   └── widget/         # Customer widget components
│       ├── ChatWidget.tsx
│       ├── NewTicketForm.tsx
│       ├── TicketChat.tsx
│       ├── TicketList.tsx
│       ├── WidgetButton.tsx
│       └── WidgetPanel.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useFileUpload.ts
│   └── useTickets.ts
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── AdminDashboard.tsx
│   ├── Login.tsx
│   └── WidgetDemo.tsx
├── types/
│   └── database.ts
├── App.tsx
├── index.css
└── main.tsx
```

## RPC Functions

### get_ticket_details(ticket_id)
Returns a ticket with all messages, attachments, and user profiles.

### get_admin_stats()
Returns ticket counts by status for the dashboard.

### search_tickets(search_term, status_filter)
Search and filter tickets with customer info and last message.

## Deployment

### Vercel

```bash
npm run build
vercel deploy
```

### Netlify

```bash
npm run build
netlify deploy --prod
```

Set environment variables in your deployment platform's settings.

## License

MIT
