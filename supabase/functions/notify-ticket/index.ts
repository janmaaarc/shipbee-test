// Supabase Edge Function: notify-ticket
// Triggered when a new ticket is created or updated
// Can be used to send notifications via email, Slack, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: {
    id: string
    customer_id: string
    subject: string
    status: string
    priority: string
  }
  old_record?: {
    status: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: TicketPayload = await req.json()

    // Get customer details
    const { data: customer } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', payload.record.customer_id)
      .single()

    // Get all admin users to notify
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'admin')

    const notification = {
      type: payload.type,
      ticket_id: payload.record.id,
      subject: payload.record.subject,
      status: payload.record.status,
      priority: payload.record.priority,
      customer_name: customer?.full_name || customer?.email || 'Unknown',
      customer_email: customer?.email,
      admin_emails: admins?.map(a => a.email) || [],
      timestamp: new Date().toISOString(),
    }

    // Log notification (in production, send to email service, Slack, etc.)
    console.log('Ticket notification:', notification)

    // Example: Auto-assign to first available admin if unassigned
    if (payload.type === 'INSERT' && admins && admins.length > 0) {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: admins[0].id })
        .eq('id', payload.record.id)
        .is('assigned_to', null)

      if (error) {
        console.error('Auto-assign error:', error)
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
