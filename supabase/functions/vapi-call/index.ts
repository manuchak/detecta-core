
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, leadId, leadName, assistantId } = await req.json()

    if (!phoneNumber || !leadId || !assistantId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // VAPI API configuration
    const VAPI_API_KEY = '4e1d9a9c-de28-4e68-926c-3b5ca5a3ecb9'
    const VAPI_BASE_URL = 'https://api.vapi.ai'

    // Create call request to VAPI
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: assistantId,
        phoneNumberId: null, // Use your VAPI phone number ID if you have one
        customer: {
          number: phoneNumber,
          name: leadName,
        },
        metadata: {
          leadId: leadId,
          source: 'lead_approval_system'
        }
      }),
    })

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text()
      console.error('VAPI API Error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to initiate VAPI call', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callData = await vapiResponse.json()
    console.log('VAPI Call created:', callData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        callId: callData.id,
        status: callData.status,
        message: 'Call initiated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in vapi-call function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
