-- Migration: Ticket Improvements
-- Adds unread tracking, last message preview, and mark as read functionality

-- ============================================
-- Table to track read receipts
-- ============================================
create table if not exists ticket_read_receipts (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(ticket_id, user_id)
);

create index idx_ticket_read_receipts_ticket_id on ticket_read_receipts(ticket_id);
create index idx_ticket_read_receipts_user_id on ticket_read_receipts(user_id);

-- Enable RLS
alter table ticket_read_receipts enable row level security;

-- RLS policies for read receipts
create policy "Users can view their own read receipts"
  on ticket_read_receipts for select
  using (user_id = auth.uid());

create policy "Users can insert their own read receipts"
  on ticket_read_receipts for insert
  with check (user_id = auth.uid());

create policy "Users can update their own read receipts"
  on ticket_read_receipts for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================
-- Function: Mark ticket as read
-- ============================================
create or replace function mark_ticket_read(p_ticket_id uuid)
returns void as $$
begin
  -- Upsert the read receipt
  insert into ticket_read_receipts (ticket_id, user_id, last_read_at)
  values (p_ticket_id, auth.uid(), now())
  on conflict (ticket_id, user_id)
  do update set last_read_at = now();
end;
$$ language plpgsql security definer;

-- ============================================
-- Function: Get unread count for a ticket
-- ============================================
create or replace function get_ticket_unread_count(
  p_ticket_id uuid,
  p_user_id uuid
)
returns integer as $$
declare
  unread_count integer;
  last_read timestamptz;
begin
  -- Get when the user last read this ticket
  select last_read_at into last_read
  from ticket_read_receipts
  where ticket_id = p_ticket_id and user_id = p_user_id;

  -- If never read, count all messages not from the user
  if last_read is null then
    select count(*) into unread_count
    from messages
    where ticket_id = p_ticket_id
    and sender_id != p_user_id;
  else
    -- Count messages after last read that aren't from the user
    select count(*) into unread_count
    from messages
    where ticket_id = p_ticket_id
    and created_at > last_read
    and sender_id != p_user_id;
  end if;

  return unread_count;
end;
$$ language plpgsql security definer;

-- ============================================
-- Updated search_tickets with unread count and last message
-- ============================================
create or replace function search_tickets(
  search_term text default '',
  status_filter ticket_status[] default null,
  priority_filter ticket_priority[] default null
)
returns json as $$
declare
  result json;
  is_admin boolean;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  select exists (
    select 1 from profiles where id = current_user_id and role = 'admin'
  ) into is_admin;

  select coalesce(json_agg(ticket_data order by ticket_data->>'last_message_at' desc nulls last, ticket_data->>'created_at' desc), '[]'::json)
  into result
  from (
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
      'unread_count', get_ticket_unread_count(t.id, current_user_id),
      'last_message_at', (
        select max(m.created_at)
        from messages m
        where m.ticket_id = t.id
      ),
      'last_message', (
        select substring(lm.content, 1, 100)
        from messages lm
        where lm.ticket_id = t.id
        order by lm.created_at desc
        limit 1
      )
    ) as ticket_data
    from tickets t
    join profiles c on c.id = t.customer_id
    where (
      is_admin or t.customer_id = current_user_id
    )
    and (
      search_term = ''
      or t.subject ilike '%' || search_term || '%'
      or c.full_name ilike '%' || search_term || '%'
      or c.email ilike '%' || search_term || '%'
    )
    and (status_filter is null or t.status = any(status_filter))
    and (priority_filter is null or t.priority = any(priority_filter))
  ) as subquery;

  return result;
end;
$$ language plpgsql security definer;

-- ============================================
-- Grant execute permissions
-- ============================================
grant execute on function mark_ticket_read(uuid) to authenticated;
grant execute on function get_ticket_unread_count(uuid, uuid) to authenticated;
grant execute on function search_tickets(text, ticket_status[], ticket_priority[]) to authenticated;
