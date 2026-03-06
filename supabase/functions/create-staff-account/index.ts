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

    // Validate caller is admin/owner using their JWT
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

    // Parse and validate input
    const { email, nombre, rol } = await req.json();

    if (!email || !nombre || !rol) {
      return new Response(JSON.stringify({ error: 'Email, nombre y rol son requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin client for user management
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate random password (user will set their own via recovery)
    const tempPassword = crypto.randomUUID() + 'A1!';

    // Create user with email pre-confirmed
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: nombre.trim() },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      const message = createError.message.includes('already been registered')
        ? 'Este email ya está registrado en el sistema'
        : `Error al crear usuario: ${createError.message}`;
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = newUser.user.id;

    // Update profile display_name
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({ id: userId, display_name: nombre.trim() }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    // Assign role in user_roles
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: userId, role: rol, is_active: true });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Try to clean up
      await adminClient.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: `Error al asignar rol: ${roleError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate password recovery link so user can set their own password
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
    });

    if (linkError) {
      console.error('Error generating recovery link:', linkError);
      // User was created successfully, just couldn't send recovery
      return new Response(JSON.stringify({
        success: true,
        warning: 'Usuario creado pero no se pudo enviar el correo de recuperación. Use "Restablecer contraseña" manualmente.',
        userId,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Staff account created: ${email} with role ${rol}`);

    return new Response(JSON.stringify({
      success: true,
      userId,
      message: `Usuario ${email} creado con rol ${rol}. Se envió correo para establecer contraseña.`,
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
