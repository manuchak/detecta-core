
import { supabase } from '@/integrations/supabase/client';

export const assignOwnerRoleToUser = async (email: string) => {
  try {
    // First, get the user ID by email from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      throw new Error(`Usuario no encontrado con email: ${email}`);
    }

    // Get the current session to use the access token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No hay sesión activa");
    }

    // Call the Edge Function to assign the owner role
    const response = await fetch('https://beefjsdgrdeiymzxwxru.supabase.co/functions/v1/assign-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        user_id: profile.id,
        role: 'owner'
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || "Error al asignar rol de owner");
    }
    
    console.log('Owner role assigned successfully:', result);
    return result;
  } catch (error) {
    console.error('Error assigning owner role:', error);
    throw error;
  }
};
