
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Get the authorization header from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create a Supabase client with the authorization header
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  try {
    // Parse the request body
    const { new_role } = await req.json();

    // Validate the role name (ensure it's lowercase with no spaces)
    const validRoleName = new_role.toLowerCase().replace(/\s+/g, '_');
    
    console.log(`Attempting to create role: ${validRoleName}`);
    
    // First check if the role already exists
    const { data: existingRoles, error: fetchError } = await supabase
      .from('role_permissions')
      .select('role')
      .eq('role', validRoleName)
      .limit(1);
      
    if (fetchError) {
      console.error('Error checking if role exists:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (existingRoles && existingRoles.length > 0) {
      return new Response(JSON.stringify({ error: 'Role already exists' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Insert directly into role_permissions table with default permissions
    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert([
        { role: validRoleName, permission_type: 'page', permission_id: 'dashboard', allowed: true },
        { role: validRoleName, permission_type: 'page', permission_id: 'profile', allowed: true }
      ]);
    
    if (insertError) {
      console.error('Error inserting role permissions:', insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ success: true, role: validRoleName }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
