-- ShipBee Support Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('customer', 'admin');
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- Profiles table (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'customer',
  created_at timestamptz not null default now()
);

-- Tickets table
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references profiles(id) on delete cascade,
  subject text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  assigned_to uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages table
create table messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Attachments table
create table attachments (
  id uuid primary key default uuid_generate_v4(),
  message_id uuid not null references messages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size bigint not null,
  created_at timestamptz not null default now()
);

-- Create indexes for better query performance
create index idx_tickets_customer_id on tickets(customer_id);
create index idx_tickets_status on tickets(status);
create index idx_tickets_assigned_to on tickets(assigned_to);
create index idx_tickets_created_at on tickets(created_at desc);
create index idx_messages_ticket_id on messages(ticket_id);
create index idx_messages_created_at on messages(created_at);
create index idx_attachments_message_id on attachments(message_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on tickets
create trigger tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at();

-- Function to create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tickets enable row level security;
alter table messages enable row level security;
alter table attachments enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS Policies for tickets
create policy "Customers can view their own tickets"
  on tickets for select
  using (customer_id = auth.uid());

create policy "Admins can view all tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Customers can create tickets"
  on tickets for insert
  with check (customer_id = auth.uid());

create policy "Admins can update any ticket"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Customers can update their own tickets"
  on tickets for update
  using (customer_id = auth.uid())
  with check (customer_id = auth.uid());

-- RLS Policies for messages
create policy "Users can view messages on their tickets"
  on messages for select
  using (
    exists (
      select 1 from tickets
      where tickets.id = messages.ticket_id
      and (tickets.customer_id = auth.uid() or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ))
    )
  );

create policy "Users can send messages on their tickets"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from tickets
      where tickets.id = ticket_id
      and (tickets.customer_id = auth.uid() or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ))
    )
  );

-- RLS Policies for attachments
create policy "Users can view attachments on their ticket messages"
  on attachments for select
  using (
    exists (
      select 1 from messages
      join tickets on tickets.id = messages.ticket_id
      where messages.id = attachments.message_id
      and (tickets.customer_id = auth.uid() or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ))
    )
  );

create policy "Users can add attachments to their messages"
  on attachments for insert
  with check (
    exists (
      select 1 from messages
      where messages.id = message_id
      and messages.sender_id = auth.uid()
    )
  );

-- Enable realtime for tickets and messages
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table messages;

-- ============================================
-- RPC Functions
-- ============================================

-- Get ticket details with messages and attachments
create or replace function get_ticket_details(p_ticket_id uuid)
returns json as $$
declare
  result json;
begin
  select json_build_object(
    'id', t.id,
    'customer_id', t.customer_id,
    'subject', t.subject,
    'status', t.status,
    'priority', t.priority,
    'assigned_to', t.assigned_to,
    'created_at', t.created_at,
    'updated_at', t.updated_at,
    'customer', json_build_object(
      'id', c.id,
      'email', c.email,
      'full_name', c.full_name,
      'avatar_url', c.avatar_url,
      'role', c.role
    ),
    'assigned_admin', case when a.id is not null then json_build_object(
      'id', a.id,
      'email', a.email,
      'full_name', a.full_name,
      'avatar_url', a.avatar_url,
      'role', a.role
    ) else null end,
    'messages', coalesce((
      select json_agg(
        json_build_object(
          'id', m.id,
          'ticket_id', m.ticket_id,
          'sender_id', m.sender_id,
          'content', m.content,
          'created_at', m.created_at,
          'sender', json_build_object(
            'id', s.id,
            'email', s.email,
            'full_name', s.full_name,
            'avatar_url', s.avatar_url,
            'role', s.role
          ),
          'attachments', coalesce((
            select json_agg(
              json_build_object(
                'id', att.id,
                'message_id', att.message_id,
                'file_name', att.file_name,
                'file_url', att.file_url,
                'file_type', att.file_type,
                'file_size', att.file_size,
                'created_at', att.created_at
              )
            )
            from attachments att
            where att.message_id = m.id
          ), '[]'::json)
        )
        order by m.created_at asc
      )
      from messages m
      join profiles s on s.id = m.sender_id
      where m.ticket_id = t.id
    ), '[]'::json)
  ) into result
  from tickets t
  join profiles c on c.id = t.customer_id
  left join profiles a on a.id = t.assigned_to
  where t.id = p_ticket_id
  and (
    t.customer_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

  return result;
end;
$$ language plpgsql security definer;

-- Get admin dashboard statistics
create or replace function get_admin_stats()
returns json as $$
declare
  result json;
begin
  -- Only allow admins
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'total_tickets', (select count(*) from tickets),
    'open_tickets', (select count(*) from tickets where status = 'open'),
    'pending_tickets', (select count(*) from tickets where status = 'pending'),
    'resolved_today', (
      select count(*) from tickets
      where status = 'resolved'
      and updated_at >= current_date
    )
  ) into result;

  return result;
end;
$$ language plpgsql security definer;

-- Search tickets with filters
create or replace function search_tickets(
  search_term text default '',
  status_filter ticket_status[] default null,
  priority_filter ticket_priority[] default null
)
returns json as $$
declare
  result json;
  is_admin boolean;
begin
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  ) into is_admin;

  select coalesce(json_agg(
    json_build_object(
      'id', t.id,
      'customer_id', t.customer_id,
      'subject', t.subject,
      'status', t.status,
      'priority', t.priority,
      'assigned_to', t.assigned_to,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'customer', json_build_object(
        'id', c.id,
        'email', c.email,
        'full_name', c.full_name,
        'avatar_url', c.avatar_url,
        'role', c.role
      )
    )
    order by t.created_at desc
  ), '[]'::json) into result
  from tickets t
  join profiles c on c.id = t.customer_id
  where (
    is_admin or t.customer_id = auth.uid()
  )
  and (
    search_term = ''
    or t.subject ilike '%' || search_term || '%'
    or c.full_name ilike '%' || search_term || '%'
    or c.email ilike '%' || search_term || '%'
  )
  and (status_filter is null or t.status = any(status_filter))
  and (priority_filter is null or t.priority = any(priority_filter));

  return result;
end;
$$ language plpgsql security definer;

-- ============================================
-- Storage Setup
-- ============================================

-- Create storage bucket for attachments (run in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false);

-- Storage policies
-- create policy "Users can upload attachments"
--   on storage.objects for insert
--   with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- create policy "Users can view attachments"
--   on storage.objects for select
--   using (bucket_id = 'attachments' and auth.role() = 'authenticated');
