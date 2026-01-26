import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PipedriveWebhookPayload {
  v: number;
  matches_filters: Record<string, unknown>;
  meta: {
    action: 'added' | 'updated' | 'deleted' | 'merged';
    object: 'deal' | 'person' | 'activity';
    id: number;
    company_id: number;
    user_id: number;
    timestamp: number;
  };
  current: Record<string, unknown> | null;
  previous: Record<string, unknown> | null;
}

interface DealData {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  stage_id: number;
  org_name?: string;
  person_name?: string;
  owner_name?: string;
  owner_id?: number;
  expected_close_date?: string;
  won_time?: string;
  lost_time?: string;
  lost_reason?: string;
  probability?: number;
  person_id?: {
    name?: string;
    email?: { value?: string }[];
    phone?: { value?: string }[];
  };
  org_id?: {
    name?: string;
  };
}

// Normalize company name for matching
function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\s*(S\.?A\.?\s*DE\s*C\.?V\.?|S\.?A\.?|S\.C\.?|S\.?DE R\.?L\.?).*$/i, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find matching client in servicios_custodia
async function findClientMatch(
  supabase: ReturnType<typeof createClient>,
  orgName: string
): Promise<{ name: string | null; confidence: number }> {
  if (!orgName) return { name: null, confidence: 0 };

  const normalized = normalizeCompanyName(orgName);
  if (!normalized) return { name: null, confidence: 0 };

  try {
    // Try exact match first
    const { data: exact } = await supabase
      .from('servicios_custodia')
      .select('nombre_cliente')
      .ilike('nombre_cliente', `%${normalized}%`)
      .limit(1);

    if (exact?.length) {
      return { name: exact[0].nombre_cliente, confidence: 1.0 };
    }

    // Try partial match with first word
    const firstWord = normalized.split(' ')[0];
    if (firstWord.length >= 3) {
      const { data: partial } = await supabase
        .from('servicios_custodia')
        .select('nombre_cliente')
        .ilike('nombre_cliente', `%${firstWord}%`)
        .limit(1);

      if (partial?.length) {
        return { name: partial[0].nombre_cliente, confidence: 0.7 };
      }
    }

    return { name: null, confidence: 0 };
  } catch (error) {
    console.error('Error finding client match:', error);
    return { name: null, confidence: 0 };
  }
}

// Get or create stage by Pipedrive ID
async function getOrCreateStage(
  supabase: ReturnType<typeof createClient>,
  pipedriveStageId: number
): Promise<string | null> {
  try {
    // Check if stage exists
    const { data: existing } = await supabase
      .from('crm_pipeline_stages')
      .select('id')
      .eq('pipedrive_id', pipedriveStageId)
      .single();

    if (existing) return existing.id;

    // Create new stage with default values
    const { data: newStage, error } = await supabase
      .from('crm_pipeline_stages')
      .insert({
        pipedrive_id: pipedriveStageId,
        name: `Stage ${pipedriveStageId}`,
        order_nr: pipedriveStageId,
        deal_probability: 50,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating stage:', error);
      return null;
    }

    return newStage?.id || null;
  } catch (error) {
    console.error('Error in getOrCreateStage:', error);
    return null;
  }
}

// Handle deal added event
async function handleDealAdded(
  supabase: ReturnType<typeof createClient>,
  dealData: DealData
): Promise<void> {
  console.log('Processing added deal:', dealData.id, dealData.title);

  const stageId = await getOrCreateStage(supabase, dealData.stage_id);
  const orgName = dealData.org_name || dealData.org_id?.name || '';
  const match = await findClientMatch(supabase, orgName);

  const personEmail = dealData.person_id?.email?.[0]?.value || null;
  const personPhone = dealData.person_id?.phone?.[0]?.value || null;
  const personName = dealData.person_name || dealData.person_id?.name || null;

  const { error } = await supabase.from('crm_deals').insert({
    pipedrive_id: dealData.id,
    title: dealData.title,
    organization_name: orgName || null,
    person_name: personName,
    person_email: personEmail,
    person_phone: personPhone,
    value: dealData.value || 0,
    currency: dealData.currency || 'MXN',
    stage_id: stageId,
    status: dealData.status || 'open',
    probability: dealData.probability || 0,
    expected_close_date: dealData.expected_close_date || null,
    won_time: dealData.won_time || null,
    lost_time: dealData.lost_time || null,
    lost_reason: dealData.lost_reason || null,
    owner_name: dealData.owner_name || null,
    owner_id: dealData.owner_id || null,
    pipedrive_data: dealData,
    matched_client_name: match.name,
    match_confidence: match.confidence,
  });

  if (error) {
    console.error('Error inserting deal:', error);
    throw error;
  }

  console.log('Deal inserted successfully:', dealData.id);
}

// Handle deal updated event
async function handleDealUpdated(
  supabase: ReturnType<typeof createClient>,
  current: DealData,
  previous: DealData | null
): Promise<void> {
  console.log('Processing updated deal:', current.id, current.title);

  // Get existing deal
  const { data: existingDeal } = await supabase
    .from('crm_deals')
    .select('id, stage_id')
    .eq('pipedrive_id', current.id)
    .single();

  if (!existingDeal) {
    console.log('Deal not found, creating new one');
    await handleDealAdded(supabase, current);
    return;
  }

  const newStageId = await getOrCreateStage(supabase, current.stage_id);
  const orgName = current.org_name || current.org_id?.name || '';
  const match = await findClientMatch(supabase, orgName);

  const personEmail = current.person_id?.email?.[0]?.value || null;
  const personPhone = current.person_id?.phone?.[0]?.value || null;
  const personName = current.person_name || current.person_id?.name || null;

  // Check if stage changed
  if (existingDeal.stage_id !== newStageId && previous) {
    const oldStageId = await getOrCreateStage(supabase, previous.stage_id);
    
    // Record stage history
    await supabase.from('crm_deal_stage_history').insert({
      deal_id: existingDeal.id,
      from_stage_id: oldStageId,
      to_stage_id: newStageId,
    });

    console.log('Stage change recorded:', oldStageId, '->', newStageId);
  }

  // Update deal
  const { error } = await supabase
    .from('crm_deals')
    .update({
      title: current.title,
      organization_name: orgName || null,
      person_name: personName,
      person_email: personEmail,
      person_phone: personPhone,
      value: current.value || 0,
      currency: current.currency || 'MXN',
      stage_id: newStageId,
      status: current.status || 'open',
      probability: current.probability || 0,
      expected_close_date: current.expected_close_date || null,
      won_time: current.won_time || null,
      lost_time: current.lost_time || null,
      lost_reason: current.lost_reason || null,
      owner_name: current.owner_name || null,
      owner_id: current.owner_id || null,
      pipedrive_data: current,
      matched_client_name: match.name,
      match_confidence: match.confidence,
      updated_at: new Date().toISOString(),
    })
    .eq('pipedrive_id', current.id);

  if (error) {
    console.error('Error updating deal:', error);
    throw error;
  }

  console.log('Deal updated successfully:', current.id);
}

// Handle deal deleted event
async function handleDealDeleted(
  supabase: ReturnType<typeof createClient>,
  dealId: number
): Promise<void> {
  console.log('Processing deleted deal:', dealId);

  const { error } = await supabase
    .from('crm_deals')
    .update({ 
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('pipedrive_id', dealId);

  if (error) {
    console.error('Error soft-deleting deal:', error);
    throw error;
  }

  console.log('Deal soft-deleted successfully:', dealId);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Supabase client with service role
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let payload: PipedriveWebhookPayload;

  try {
    payload = await req.json();
    console.log('Received webhook:', JSON.stringify(payload.meta));
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Log webhook for debugging
  const eventType = `${payload.meta?.action}.${payload.meta?.object}`;
  try {
    await supabase.from('crm_webhook_logs').insert({
      event_type: eventType,
      payload: payload,
      processed: false,
    });
  } catch (logError) {
    console.error('Error logging webhook:', logError);
  }

  // Process only deal events
  if (payload.meta?.object !== 'deal') {
    console.log('Ignoring non-deal event:', payload.meta?.object);
    
    await supabase
      .from('crm_webhook_logs')
      .update({ processed: true })
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ success: true, message: 'Non-deal event ignored' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const action = payload.meta.action;
    const dealId = payload.meta.id;

    switch (action) {
      case 'added':
        if (payload.current) {
          await handleDealAdded(supabase, payload.current as unknown as DealData);
        }
        break;

      case 'updated':
        if (payload.current) {
          await handleDealUpdated(
            supabase,
            payload.current as unknown as DealData,
            payload.previous as unknown as DealData | null
          );
        }
        break;

      case 'deleted':
        await handleDealDeleted(supabase, dealId);
        break;

      case 'merged':
        // Handle merge as update of the surviving deal
        if (payload.current) {
          await handleDealUpdated(
            supabase,
            payload.current as unknown as DealData,
            null
          );
        }
        break;

      default:
        console.log('Unknown action:', action);
    }

    // Mark as processed
    await supabase
      .from('crm_webhook_logs')
      .update({ processed: true })
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ success: true, action, dealId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Log error
    await supabase
      .from('crm_webhook_logs')
      .update({ 
        processed: false, 
        error_message: error instanceof Error ? error.message : String(error) 
      })
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ error: 'Processing failed', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
