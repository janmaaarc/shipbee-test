import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TicketPayload {
  type: 'INSERT'
  table: 'tickets'
  record: {
    id: string
    customer_id: string
    subject: string
    status: string
    priority: string
    created_at: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: TicketPayload = await req.json()

    // Only process INSERT events on tickets table
    if (payload.type !== 'INSERT' || payload.table !== 'tickets') {
      return new Response(JSON.stringify({ message: 'Ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get customer details
    const { data: customer } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', payload.record.customer_id)
      .single()

    // Get available admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'admin')

    // Log notification (in production, you'd send email/slack/etc)
    console.log('New ticket created:', {
      ticket_id: payload.record.id,
      subject: payload.record.subject,
      customer: customer?.full_name || customer?.email,
      admins_notified: admins?.length || 0,
    })

    // Auto-assign to first available admin if none assigned
    if (admins && admins.length > 0) {
      // Simple round-robin: assign to admin with least open tickets
      const { data: adminWithLeastTickets } = await supabase
        .from('tickets')
        .select('assigned_to')
        .eq('status', 'open')
        .not('assigned_to', 'is', null)

      const ticketCounts: Record<string, number> = {}
      adminWithLeastTickets?.forEach((t) => {
        if (t.assigned_to) {
          ticketCounts[t.assigned_to] = (ticketCounts[t.assigned_to] || 0) + 1
        }
      })

      // Find admin with least tickets
      let selectedAdmin = admins[0]
      let minTickets = ticketCounts[admins[0].id] || 0

      for (const admin of admins) {
        const count = ticketCounts[admin.id] || 0
        if (count < minTickets) {
          minTickets = count
          selectedAdmin = admin
        }
      }

      // Assign ticket to selected admin
      await supabase
        .from('tickets')
        .update({ assigned_to: selectedAdmin.id })
        .eq('id', payload.record.id)

      console.log('Ticket auto-assigned to:', selectedAdmin.full_name || selectedAdmin.email)
    }

    return new Response(
      JSON.stringify({
        message: 'Notification processed',
        ticket_id: payload.record.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing ticket notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
