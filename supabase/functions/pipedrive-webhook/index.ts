import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  person_id?: number | {
    name?: string;
    email?: { value?: string }[];
    phone?: { value?: string }[];
  };
  org_id?: number | {
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
  if (!pipedriveStageId) return null;
  
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
  
  // Handle org_id being either a number or object
  let orgName = dealData.org_name || '';
  if (typeof dealData.org_id === 'object' && dealData.org_id?.name) {
    orgName = dealData.org_id.name;
  }
  
  const match = await findClientMatch(supabase, orgName);

  // Handle person_id being either a number or object
  let personEmail: string | null = null;
  let personPhone: string | null = null;
  let personName = dealData.person_name || null;
  
  if (typeof dealData.person_id === 'object' && dealData.person_id) {
    personEmail = dealData.person_id.email?.[0]?.value || null;
    personPhone = dealData.person_id.phone?.[0]?.value || null;
    personName = dealData.person_id.name || personName;
  }

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
  previous: Record<string, unknown> | null
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
  
  // Handle org_id being either a number or object
  let orgName = current.org_name || '';
  if (typeof current.org_id === 'object' && current.org_id?.name) {
    orgName = current.org_id.name;
  }
  
  const match = await findClientMatch(supabase, orgName);

  // Handle person_id being either a number or object
  let personEmail: string | null = null;
  let personPhone: string | null = null;
  let personName = current.person_name || null;
  
  if (typeof current.person_id === 'object' && current.person_id) {
    personEmail = current.person_id.email?.[0]?.value || null;
    personPhone = current.person_id.phone?.[0]?.value || null;
    personName = current.person_id.name || personName;
  }

  // Check if stage changed (only if previous has stage_id)
  const previousStageId = previous?.stage_id as number | undefined;
  if (existingDeal.stage_id !== newStageId && previousStageId) {
    const oldStageId = await getOrCreateStage(supabase, previousStageId);
    
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

// Parse webhook and extract normalized data
// Pipedrive v2.0 has: meta.action, meta.entity, meta.entity_id, data (deal object), previous
// Pipedrive v1.0 has: meta.action, meta.object, meta.id, current, previous
function parseWebhook(payload: Record<string, unknown>): {
  action: string;
  entity: string;
  entityId: number;
  data: Record<string, unknown> | null;
  previous: Record<string, unknown> | null;
} {
  // Check for v2.0 format: meta object with entity, action, entity_id + data field
  const meta = payload.meta as Record<string, unknown> | undefined;
  
  if (meta && meta.entity && meta.action) {
    // v2.0 format
    console.log('Detected Pipedrive webhook v2.0 format');
    
    // Map v2 actions to normalized format
    const actionMap: Record<string, string> = {
      'create': 'added',
      'change': 'updated', 
      'delete': 'deleted',
      'merge': 'merged',
    };
    
    const action = String(meta.action);
    const entity = String(meta.entity);
    const entityId = typeof meta.entity_id === 'string' 
      ? parseInt(meta.entity_id, 10) 
      : (meta.entity_id as number || 0);
    
    return {
      action: actionMap[action] || action,
      entity,
      entityId,
      data: payload.data as Record<string, unknown> | null,
      previous: payload.previous as Record<string, unknown> | null,
    };
  }
  
  // Check for v1.0 format: meta.object, meta.action, meta.id + current
  if (meta && meta.object && meta.action && meta.id !== undefined) {
    console.log('Detected Pipedrive webhook v1.0 format');
    
    return {
      action: String(meta.action),
      entity: String(meta.object),
      entityId: meta.id as number,
      data: payload.current as Record<string, unknown> | null,
      previous: payload.previous as Record<string, unknown> | null,
    };
  }
  
  // Fallback: check if action/entity at root level (simple test payload)
  if (payload.action && payload.entity) {
    console.log('Detected simple/test webhook format');
    
    const actionMap: Record<string, string> = {
      'create': 'added',
      'change': 'updated', 
      'delete': 'deleted',
      'merge': 'merged',
    };
    
    const action = String(payload.action);
    return {
      action: actionMap[action] || action,
      entity: String(payload.entity),
      entityId: parseInt(String(payload.entity_id || 0), 10),
      data: payload.data as Record<string, unknown> | null,
      previous: payload.previous as Record<string, unknown> | null,
    };
  }
  
  console.log('Unknown webhook format:', JSON.stringify(payload).slice(0, 200));
  return {
    action: 'unknown',
    entity: 'unknown',
    entityId: 0,
    data: null,
    previous: null,
  };
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

  let rawPayload: Record<string, unknown>;

  try {
    rawPayload = await req.json();
    console.log('Received webhook, keys:', Object.keys(rawPayload).join(', '));
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Parse and normalize webhook format
  const webhook = parseWebhook(rawPayload);
  const eventType = `${webhook.action}.${webhook.entity}`;
  
  console.log('Parsed webhook:', eventType, 'entity_id:', webhook.entityId);

  // Log webhook for debugging
  try {
    await supabase.from('crm_webhook_logs').insert({
      event_type: eventType,
      payload: { 
        data: webhook.data, 
        previous: webhook.previous,
        meta: rawPayload 
      },
      processed: false,
    });
  } catch (logError) {
    console.error('Error logging webhook:', logError);
  }

  // Process only deal events
  if (webhook.entity !== 'deal') {
    console.log('Ignoring non-deal event:', webhook.entity);
    
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
    const dealId = webhook.entityId;
    const dealData = webhook.data as unknown as DealData;
    const previousData = webhook.previous;

    console.log('Processing deal event:', webhook.action, 'dealId:', dealId, 'hasData:', !!dealData);

    switch (webhook.action) {
      case 'added':
        if (dealData) {
          await handleDealAdded(supabase, dealData);
        } else {
          console.log('No deal data for added event');
        }
        break;

      case 'updated':
        if (dealData) {
          await handleDealUpdated(supabase, dealData, previousData);
        } else {
          console.log('No deal data for updated event');
        }
        break;

      case 'deleted':
        await handleDealDeleted(supabase, dealId);
        break;

      case 'merged':
        // Handle merge as update of the surviving deal
        if (dealData) {
          await handleDealUpdated(supabase, dealData, null);
        }
        break;

      default:
        console.log('Unknown action:', webhook.action);
    }

    // Mark as processed
    await supabase
      .from('crm_webhook_logs')
      .update({ processed: true })
      .eq('event_type', eventType)
      .order('created_at', { ascending: false })
      .limit(1);

    return new Response(
      JSON.stringify({ success: true, action: webhook.action, dealId }),
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
