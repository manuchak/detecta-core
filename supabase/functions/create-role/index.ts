
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Obtener el encabezado de autorización
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No se proporcionó encabezado de autorización' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Analizar el cuerpo de la solicitud
    const { new_role } = await req.json();
    
    // Validación de entrada
    if (!new_role || typeof new_role !== 'string') {
      return new Response(JSON.stringify({ error: 'Nombre de rol inválido proporcionado' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar el nombre del rol (asegurar que sea minúsculas sin espacios)
    const validRoleName = new_role.toLowerCase().replace(/\s+/g, '_');
    
    console.log(`Intentando crear rol: ${validRoleName}`);
    
    // Conexión directa a la base de datos para evitar problemas de recursión RLS
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    if (!databaseUrl) {
      throw new Error('URL de base de datos no encontrada en el entorno');
    }
    
    const pool = new Pool(databaseUrl, 3); // Limitar a 3 conexiones
    const connection = await pool.connect();
    
    try {
      // Extraer token JWT
      const token = authHeader.replace('Bearer ', '');
      
      // Primero, verificar si el usuario tiene rol de propietario
      const userRoleResult = await connection.queryObject`
        WITH jwt_sub AS (
          SELECT 
            (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub') as user_id
        )
        SELECT ur.role 
        FROM public.user_roles ur 
        JOIN jwt_sub ON ur.user_id = jwt_sub.user_id::uuid
        ORDER BY 
          CASE ur.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            ELSE 3
          END
        LIMIT 1
      `;
      
      if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].role !== 'owner') {
        // Segunda estrategia: decodificar el JWT directamente
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.sub;
          
          if (!userId) {
            return new Response(JSON.stringify({ error: 'No se pudo obtener ID de usuario del JWT' }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Verificar rol directamente
          const directRoleResult = await connection.queryObject`
            SELECT role 
            FROM user_roles 
            WHERE user_id = ${userId}
            ORDER BY 
              CASE role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                ELSE 3
              END
            LIMIT 1
          `;
          
          if (directRoleResult.rows.length === 0 || 
              (directRoleResult.rows[0].role !== 'owner' && directRoleResult.rows[0].role !== 'admin')) {
            return new Response(JSON.stringify({ error: 'Solo propietarios o administradores pueden crear roles' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
        } catch (e) {
          console.error('Error al decodificar o procesar JWT:', e);
          return new Response(JSON.stringify({ error: 'Error al procesar autenticación' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Verificar si el rol ya existe
      const checkResult = await connection.queryObject`
        SELECT role FROM role_permissions WHERE role = ${validRoleName} LIMIT 1
      `;
      
      if (checkResult.rows.length > 0) {
        return new Response(JSON.stringify({ error: 'El rol ya existe' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Insertar directamente en la tabla role_permissions con permisos predeterminados
      await connection.queryArray`
        INSERT INTO role_permissions (role, permission_type, permission_id, allowed)
        VALUES 
          (${validRoleName}, 'page', 'dashboard', true),
          (${validRoleName}, 'page', 'profile', true)
      `;
      
      // Insertar una entrada marcador en user_roles para registrar el rol
      // Usando un UUID especial que no coincidirá con ningún usuario real
      await connection.queryArray`
        INSERT INTO user_roles (user_id, role)
        VALUES ('00000000-0000-0000-0000-000000000000', ${validRoleName})
      `;
      
      return new Response(JSON.stringify({ success: true, role: validRoleName }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      // Limpiar recursos
      connection.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
