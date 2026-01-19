-- Migration: Security Fixes
-- 1. Prevent messages on closed tickets
-- 2. Add server-side rate limiting for messages

-- ============================================
-- Fix: Prevent messages on closed tickets
-- ============================================

-- Drop the existing message insert policy
drop policy if exists "Users can send messages on their tickets" on messages;

-- Create new policy that checks ticket status
create policy "Users can send messages on non-closed tickets"
  on messages for insert
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from tickets
      where tickets.id = ticket_id
      and tickets.status != 'closed'
      and (tickets.customer_id = auth.uid() or exists (
        select 1 from profiles where id = auth.uid() and role = 'admin'
      ))
    )
  );

-- ============================================
-- Server-side rate limiting for messages
-- ============================================

-- Create table to track message rate limits
create table if not exists message_rate_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  message_count integer not null default 1,
  window_start timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id)
);

create index idx_message_rate_limits_user_id on message_rate_limits(user_id);

-- Enable RLS on rate limits table
alter table message_rate_limits enable row level security;

-- Only the system can read/write rate limits (via security definer functions)
create policy "No direct access to rate limits"
  on message_rate_limits for all
  using (false);

-- Function to check and update rate limit
-- Returns true if allowed, false if rate limited
create or replace function check_message_rate_limit(p_user_id uuid)
returns boolean as $$
declare
  rate_limit_window interval := interval '1 minute';
  max_messages_per_window integer := 10;
  current_record message_rate_limits%rowtype;
begin
  -- Get or create rate limit record
  select * into current_record
  from message_rate_limits
  where user_id = p_user_id
  for update;

  if not found then
    -- First message from this user
    insert into message_rate_limits (user_id, message_count, window_start)
    values (p_user_id, 1, now());
    return true;
  end if;

  -- Check if window has expired
  if current_record.window_start + rate_limit_window < now() then
    -- Reset the window
    update message_rate_limits
    set message_count = 1, window_start = now()
    where user_id = p_user_id;
    return true;
  end if;

  -- Check if under limit
  if current_record.message_count < max_messages_per_window then
    -- Increment counter
    update message_rate_limits
    set message_count = message_count + 1
    where user_id = p_user_id;
    return true;
  end if;

  -- Rate limited
  return false;
end;
$$ language plpgsql security definer;

-- Function to send a message with rate limiting
create or replace function send_message(
  p_ticket_id uuid,
  p_content text
)
returns json as $$
declare
  current_user_id uuid;
  ticket_record tickets%rowtype;
  new_message messages%rowtype;
  is_admin boolean;
begin
  current_user_id := auth.uid();

  -- Check authentication
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check rate limit
  if not check_message_rate_limit(current_user_id) then
    raise exception 'Rate limit exceeded. Please wait before sending more messages.';
  end if;

  -- Check if user is admin
  select exists (
    select 1 from profiles where id = current_user_id and role = 'admin'
  ) into is_admin;

  -- Get ticket and verify access
  select * into ticket_record
  from tickets
  where id = p_ticket_id;

  if not found then
    raise exception 'Ticket not found';
  end if;

  -- Check if ticket is closed
  if ticket_record.status = 'closed' then
    raise exception 'Cannot send messages to closed tickets';
  end if;

  -- Check access
  if not is_admin and ticket_record.customer_id != current_user_id then
    raise exception 'Access denied';
  end if;

  -- Validate content
  if p_content is null or trim(p_content) = '' then
    raise exception 'Message content cannot be empty';
  end if;

  -- Insert message
  insert into messages (ticket_id, sender_id, content)
  values (p_ticket_id, current_user_id, trim(p_content))
  returning * into new_message;

  -- Update ticket timestamp
  update tickets
  set updated_at = now()
  where id = p_ticket_id;

  -- Return the new message
  return json_build_object(
    'id', new_message.id,
    'ticket_id', new_message.ticket_id,
    'sender_id', new_message.sender_id,
    'content', new_message.content,
    'created_at', new_message.created_at
  );
end;
$$ language plpgsql security definer;

-- Grant execute permissions
grant execute on function check_message_rate_limit(uuid) to authenticated;
grant execute on function send_message(uuid, text) to authenticated;

-- ============================================
-- Also prevent customers from updating closed tickets
-- ============================================

-- Drop existing customer update policy
drop policy if exists "Customers can update their own tickets" on tickets;

-- Create new policy that prevents updates to closed tickets
create policy "Customers can update their own non-closed tickets"
  on tickets for update
  using (customer_id = auth.uid() and status != 'closed')
  with check (customer_id = auth.uid());
