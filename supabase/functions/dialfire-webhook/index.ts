import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dialfire-signature',
};

// HMAC signature validation
const validateWebhookSignature = (
  payload: string,
  receivedSignature: string,
  secret: string
): boolean => {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');
  
  return computedSignature.length === receivedSignature.length &&
    computedSignature === receivedSignature;
};

// Zod validation schema
const DialfirePayloadSchema = z.object({
  call_id: z.string().trim().min(1).max(100),
  campaign_id: z.string().trim().min(1).max(100),
  phone_number: z.string().trim().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone format'),
  call_status: z.enum(['completed', 'no-answer', 'busy', 'failed', 'voicemail', 'answered', 'in-progress']),
  call_duration: z.number().int().min(0).max(86400).nullable().optional().default(0),
  agent_id: z.string().max(100).optional().nullable(),
  agent_notes: z.string().max(5000).optional().nullable(),
  started_at: z.string().datetime().optional().nullable(),
  ended_at: z.string().datetime().optional().nullable(),
  recording_url: z.string().url().max(500).optional().nullable(),
  custom_data: z.record(z.unknown()).optional().nullable().default({})
});

type DialfirePayload = z.infer<typeof DialfirePayloadSchema>;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('DIALFIRE_WEBHOOK_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Validate HMAC signature
    const receivedSignature = req.headers.get('X-Dialfire-Signature');
    const rawBody = await req.text();
    
    if (!receivedSignature) {
      console.error('❌ Missing webhook signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    if (!validateWebhookSignature(rawBody, receivedSignature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    console.log('✅ Webhook signature validated');

    // Step 2: Validate payload with Zod
    const payloadRaw = JSON.parse(rawBody);
    const validationResult = DialfirePayloadSchema.safeParse(payloadRaw);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      console.error('❌ Webhook payload validation failed:', JSON.stringify(errors, null, 2));
      
      return new Response(
        JSON.stringify({
          error: 'Invalid webhook payload',
          details: errors.fieldErrors
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Webhook payload validated successfully');
    const payload: DialfirePayload = validationResult.data;
    console.log('Received Dialfire webhook:', JSON.stringify(payload, null, 2));

    // Parse Dialfire payload
    const {
      call_id,
      campaign_id,
      phone_number,
      call_status,
      call_duration,
      agent_id,
      agent_notes,
      started_at,
      ended_at,
      recording_url,
      custom_data,
    } = payload;

    // Determinar si es test mode
    const isTest = custom_data?.is_test === true || campaign_id?.includes('test');

    // Buscar candidato por teléfono
    const { data: candidato } = await supabase
      .from('candidatos_custodios')
      .select('id')
      .eq('telefono', phone_number)
      .maybeSingle();

    // Insertar log de Dialfire
    const { data: callLog, error } = await supabase
      .from('dialfire_call_logs')
      .insert({
        dialfire_call_id: call_id,
        candidato_id: candidato?.id || null,
        campaign_id,
        phone_number,
        call_outcome: call_status,
        call_duration: call_duration || 0,
        agent_id,
        agent_notes,
        call_started_at: started_at,
        call_ended_at: ended_at,
        recording_url,
        metadata: custom_data || {},
        is_test: isTest,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting Dialfire log:', error);
      throw error;
    }

    console.log('Dialfire call log created:', callLog.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        call_log_id: callLog.id,
        is_test: isTest,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in dialfire-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check edge function logs for more info',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
