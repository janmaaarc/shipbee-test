-- ShipBee Support - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE user_role AS ENUM ('customer', 'admin');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tickets table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    status ticket_status DEFAULT 'open' NOT NULL,
    priority ticket_priority DEFAULT 'medium' NOT NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Attachments table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, update own
CREATE POLICY "Profiles are viewable by authenticated users"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Tickets: Customers see own, admins see all
CREATE POLICY "Customers can view own tickets"
    ON tickets FOR SELECT
    TO authenticated
    USING (
        customer_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Customers can create tickets"
    ON tickets FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can update any ticket"
    ON tickets FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Messages: Users can read messages for tickets they have access to
CREATE POLICY "Users can view messages for accessible tickets"
    ON messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (t.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Users can send messages to accessible tickets"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM tickets t
            WHERE t.id = ticket_id
            AND (t.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- Attachments: Same access as messages
CREATE POLICY "Users can view attachments for accessible messages"
    ON attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN tickets t ON t.id = m.ticket_id
            WHERE m.id = message_id
            AND (t.customer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Users can upload attachments to own messages"
    ON attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_id
            AND m.sender_id = auth.uid()
        )
    );

-- ============================================
-- RPC Functions
-- ============================================

-- Get ticket with all details (messages, attachments, profiles)
CREATE OR REPLACE FUNCTION get_ticket_details(p_ticket_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', t.id,
        'subject', t.subject,
        'status', t.status,
        'priority', t.priority,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'customer', json_build_object(
            'id', c.id,
            'email', c.email,
            'full_name', c.full_name,
            'avatar_url', c.avatar_url,
            'role', c.role
        ),
        'assigned_agent', CASE WHEN a.id IS NOT NULL THEN json_build_object(
            'id', a.id,
            'email', a.email,
            'full_name', a.full_name,
            'avatar_url', a.avatar_url,
            'role', a.role
        ) ELSE NULL END,
        'messages', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', m.id,
                    'content', m.content,
                    'created_at', m.created_at,
                    'sender', json_build_object(
                        'id', s.id,
                        'email', s.email,
                        'full_name', s.full_name,
                        'avatar_url', s.avatar_url,
                        'role', s.role
                    ),
                    'attachments', COALESCE((
                        SELECT json_agg(
                            json_build_object(
                                'id', att.id,
                                'file_name', att.file_name,
                                'file_url', att.file_url,
                                'file_type', att.file_type,
                                'file_size', att.file_size
                            )
                        ) FROM attachments att WHERE att.message_id = m.id
                    ), '[]'::json)
                )
                ORDER BY m.created_at ASC
            )
            FROM messages m
            JOIN profiles s ON s.id = m.sender_id
            WHERE m.ticket_id = t.id
        ), '[]'::json)
    ) INTO result
    FROM tickets t
    JOIN profiles c ON c.id = t.customer_id
    LEFT JOIN profiles a ON a.id = t.assigned_to
    WHERE t.id = p_ticket_id;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'open', COUNT(*) FILTER (WHERE status = 'open'),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
        'closed', COUNT(*) FILTER (WHERE status = 'closed')
    ) INTO result
    FROM tickets;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search tickets with filters
CREATE OR REPLACE FUNCTION search_tickets(
    search_term TEXT DEFAULT '',
    status_filter ticket_status[] DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', t.id,
                'subject', t.subject,
                'status', t.status,
                'priority', t.priority,
                'created_at', t.created_at,
                'updated_at', t.updated_at,
                'customer', json_build_object(
                    'id', c.id,
                    'email', c.email,
                    'full_name', c.full_name
                ),
                'last_message', (
                    SELECT json_build_object(
                        'content', m.content,
                        'created_at', m.created_at
                    )
                    FROM messages m
                    WHERE m.ticket_id = t.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                )
            )
            ORDER BY t.updated_at DESC
        ), '[]'::json)
        FROM tickets t
        JOIN profiles c ON c.id = t.customer_id
        WHERE (search_term = '' OR t.subject ILIKE '%' || search_term || '%' OR c.email ILIKE '%' || search_term || '%')
        AND (status_filter IS NULL OR t.status = ANY(status_filter))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Storage bucket for attachments
-- ============================================
-- Run this in Supabase Dashboard > Storage > Create bucket
-- Bucket name: attachments
-- Public: false
-- File size limit: 10MB
-- Allowed MIME types: image/*, video/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Storage policies (run in SQL editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Users can view attachments they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attachments');

-- ============================================
-- Enable Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
