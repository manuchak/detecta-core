import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PIPEDRIVE_API_V1 = 'https://api.pipedrive.com/v1';

interface SyncResult {
  pipelines: number;
  stages: number;
  deals: number;
  matches: number;
  errors: string[];
}

// Normalize name for matching
function normalizeName(name: string | null): string {
  if (!name) return '';
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find client match in servicios_custodia
async function findClientMatch(
  supabase: ReturnType<typeof createClient>,
  orgName: string | null
): Promise<{ name: string | null; confidence: number }> {
  if (!orgName) return { name: null, confidence: 0 };

  const normalizedOrg = normalizeName(orgName);
  if (!normalizedOrg) return { name: null, confidence: 0 };

  // Get distinct client names
  const { data: clients, error } = await supabase
    .from('servicios_custodia')
    .select('nombre_cliente')
    .not('nombre_cliente', 'is', null)
    .limit(1000);

  if (error || !clients) return { name: null, confidence: 0 };

  // Find best match
  const uniqueClients = [...new Set(clients.map(c => c.nombre_cliente).filter(Boolean))];
  
  for (const clientName of uniqueClients) {
    const normalizedClient = normalizeName(clientName);
    
    // Exact match
    if (normalizedClient === normalizedOrg) {
      return { name: clientName, confidence: 1.0 };
    }
    
    // Contains match
    if (normalizedClient.includes(normalizedOrg) || normalizedOrg.includes(normalizedClient)) {
      return { name: clientName, confidence: 0.8 };
    }
    
    // Word overlap
    const orgWords = normalizedOrg.split(' ').filter(w => w.length > 2);
    const clientWords = normalizedClient.split(' ').filter(w => w.length > 2);
    const matchingWords = orgWords.filter(w => clientWords.some(cw => cw.includes(w) || w.includes(cw)));
    
    if (matchingWords.length >= 2 || (matchingWords.length === 1 && orgWords.length === 1)) {
      return { name: clientName, confidence: 0.6 };
    }
  }

  return { name: null, confidence: 0 };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[pipedrive-sync] Starting synchronization...');

    // Get Pipedrive API token
    const PIPEDRIVE_API_TOKEN = Deno.env.get('PIPEDRIVE_API_TOKEN');
    if (!PIPEDRIVE_API_TOKEN) {
      throw new Error('PIPEDRIVE_API_TOKEN not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const result: SyncResult = {
      pipelines: 0,
      stages: 0,
      deals: 0,
      matches: 0,
      errors: [],
    };

    // =========== SYNC PIPELINES & STAGES ===========
    console.log('[pipedrive-sync] Fetching pipelines...');
    const pipelinesRes = await fetch(
      `${PIPEDRIVE_API_V1}/pipelines?api_token=${PIPEDRIVE_API_TOKEN}`
    );
    const pipelinesData = await pipelinesRes.json();

    if (!pipelinesData.success) {
      throw new Error(`Pipedrive API error: ${JSON.stringify(pipelinesData)}`);
    }

    const pipelines = pipelinesData.data || [];
    result.pipelines = pipelines.length;
    console.log(`[pipedrive-sync] Found ${pipelines.length} pipelines`);

    // First, delete old dummy stages
    await supabase
      .from('crm_pipeline_stages')
      .delete()
      .eq('pipeline_name', 'Main Pipeline');

    // Fetch and sync stages for each pipeline
    for (const pipeline of pipelines) {
      console.log(`[pipedrive-sync] Fetching stages for pipeline: ${pipeline.name}`);
      
      const stagesRes = await fetch(
        `${PIPEDRIVE_API_V1}/stages?pipeline_id=${pipeline.id}&api_token=${PIPEDRIVE_API_TOKEN}`
      );
      const stagesData = await stagesRes.json();

      if (!stagesData.success) {
        result.errors.push(`Failed to fetch stages for pipeline ${pipeline.id}`);
        continue;
      }

      const stages = stagesData.data || [];
      
      for (const stage of stages) {
        const { error } = await supabase
          .from('crm_pipeline_stages')
          .upsert({
            pipedrive_id: stage.id,
            name: stage.name,
            pipeline_name: pipeline.name,
            order_nr: stage.order_nr,
            deal_probability: stage.deal_probability ?? 50,
            is_active: stage.active_flag ?? true,
          }, { onConflict: 'pipedrive_id' });

        if (error) {
          result.errors.push(`Stage upsert error: ${error.message}`);
        } else {
          result.stages++;
        }
      }
    }

    console.log(`[pipedrive-sync] Synced ${result.stages} stages`);

    // =========== BUILD STAGE ID MAP ===========
    const { data: dbStages } = await supabase
      .from('crm_pipeline_stages')
      .select('id, pipedrive_id');
    
    const stageIdMap = new Map<number, string>();
    (dbStages || []).forEach(s => {
      if (s.pipedrive_id) stageIdMap.set(s.pipedrive_id, s.id);
    });

    // =========== SYNC DEALS ===========
    console.log('[pipedrive-sync] Fetching deals...');
    
    let start = 0;
    const limit = 500;
    let hasMore = true;

    while (hasMore) {
      console.log(`[pipedrive-sync] Fetching deals batch starting at ${start}...`);
      
      const dealsRes = await fetch(
        `${PIPEDRIVE_API_V1}/deals?start=${start}&limit=${limit}&api_token=${PIPEDRIVE_API_TOKEN}`
      );
      const dealsData = await dealsRes.json();

      if (!dealsData.success) {
        result.errors.push(`Failed to fetch deals at offset ${start}`);
        break;
      }

      const deals = dealsData.data || [];
      console.log(`[pipedrive-sync] Processing ${deals.length} deals...`);

      for (const deal of deals) {
        // Get stage UUID from map
        const stageId = stageIdMap.get(deal.stage_id) || null;

        // Extract org name
        let orgName: string | null = null;
        if (deal.org_id && typeof deal.org_id === 'object') {
          orgName = deal.org_id.name || null;
        } else if (deal.org_name) {
          orgName = deal.org_name;
        }

        // Extract person info
        let personName: string | null = null;
        let personEmail: string | null = null;
        let personPhone: string | null = null;
        if (deal.person_id && typeof deal.person_id === 'object') {
          personName = deal.person_id.name || null;
          if (deal.person_id.email && Array.isArray(deal.person_id.email)) {
            personEmail = deal.person_id.email[0]?.value || null;
          }
          if (deal.person_id.phone && Array.isArray(deal.person_id.phone)) {
            personPhone = deal.person_id.phone[0]?.value || null;
          }
        } else if (deal.person_name) {
          personName = deal.person_name;
        }

        // Find client match
        const match = await findClientMatch(supabase, orgName);
        if (match.name) result.matches++;

        // Get owner name
        let ownerName: string | null = null;
        if (deal.owner_name) {
          ownerName = deal.owner_name;
        } else if (deal.user_id && typeof deal.user_id === 'object') {
          ownerName = deal.user_id.name || null;
        }

        const { error } = await supabase
          .from('crm_deals')
          .upsert({
            pipedrive_id: deal.id,
            title: deal.title,
            organization_name: orgName,
            person_name: personName,
            person_email: personEmail,
            person_phone: personPhone,
            value: deal.value || 0,
            currency: deal.currency || 'MXN',
            stage_id: stageId,
            status: deal.status || 'open',
            probability: deal.probability ?? 50,
            expected_close_date: deal.expected_close_date || null,
            won_time: deal.won_time || null,
            lost_time: deal.lost_time || null,
            lost_reason: deal.lost_reason || null,
            owner_name: ownerName,
            owner_id: typeof deal.user_id === 'number' ? deal.user_id : deal.user_id?.id || null,
            matched_client_name: match.name,
            match_confidence: match.confidence,
            is_deleted: deal.deleted || false,
            pipedrive_data: deal,
          }, { onConflict: 'pipedrive_id' });

        if (error) {
          console.error(`[pipedrive-sync] Deal upsert error for ${deal.id}:`, error.message);
          result.errors.push(`Deal ${deal.id}: ${error.message}`);
        } else {
          result.deals++;
        }
      }

      // Check pagination
      hasMore = dealsData.additional_data?.pagination?.more_items_in_collection ?? false;
      start += limit;
    }

    console.log('[pipedrive-sync] Sync completed:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronización completada: ${result.pipelines} pipelines, ${result.stages} etapas, ${result.deals} deals, ${result.matches} matches`,
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[pipedrive-sync] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
