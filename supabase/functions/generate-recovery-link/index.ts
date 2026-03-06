import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: isAdmin, error: adminError } = await callerClient.rpc('is_admin_user_secure');
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Sin permisos de administrador' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, origin } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appOrigin = origin || 'https://detecta-core.lovable.app';

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError);
      return new Response(JSON.stringify({ error: `Error al generar link: ${linkError.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      return new Response(JSON.stringify({ error: 'No se pudo generar el link de recuperación' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract token_hash from the Supabase action_link and build an indirect URL
    // that points to our app instead of Supabase's /auth/v1/verify endpoint.
    // This prevents chat bots (Teams, Slack, WhatsApp) from consuming the
    // one-time token via link-preview prefetch requests.
    const actionUrl = new URL(actionLink);
    const tokenHash = actionUrl.searchParams.get('token');

    if (!tokenHash) {
      console.error('Could not extract token from action_link:', actionLink);
      return new Response(JSON.stringify({ error: 'No se pudo extraer el token del link generado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build app-level recovery URL — bot prefetch will only load static HTML, not consume the token
    const recoveryUrl = `${appOrigin}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;

    console.log(`Recovery link generated for ${email} by admin (indirect URL, immune to prefetch), redirecting to ${appOrigin}`);

    return new Response(JSON.stringify({
      success: true,
      recovery_link: recoveryUrl,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
