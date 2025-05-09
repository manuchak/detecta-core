
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Pool, PoolClient } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

// Definición de encabezados CORS para permitir solicitudes externas
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interfaz para la respuesta de credenciales
interface ApiCredentialResponse {
  success: boolean;
  service_name?: string;
  user?: string;
  password?: string;
  connection_string?: string;
  instructions?: string;
  important_note?: string;
  error?: string;
}

// Interfaz para la solicitud
interface ServiceNameRequest {
  serviceName: string;
}

/**
 * Verifica que el usuario tiene los permisos necesarios
 */
async function verifyUserPermissions(connection: PoolClient, userId: string): Promise<boolean> {
  try {
    const userRoleResult = await connection.queryObject(`
      SELECT role 
      FROM user_roles 
      WHERE user_id = $1
      ORDER BY 
        CASE role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END
      LIMIT 1
    `, [userId]);
    
    if (userRoleResult.rows.length === 0) {
      return false;
    }
    
    const userRole = userRoleResult.rows[0].role as string;
    return userRole === 'owner' || userRole === 'admin';
  } catch (error) {
    console.error('Error verificando permisos:', error);
    return false;
  }
}

/**
 * Genera una contraseña segura y aleatoria
 */
function generateSecurePassword(length: number = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let result = '';
  
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(randomValues[i] % chars.length);
  }
  
  return result;
}

/**
 * Sanitiza el nombre del servicio para evitar inyección SQL
 */
function sanitizeServiceName(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 30);
}

/**
 * Guarda las credenciales en la tabla de secrets si existe
 */
async function saveCredentialsToSecrets(
  connection: PoolClient, 
  serviceName: string, 
  connectionString: string
): Promise<void> {
  try {
    await connection.queryArray(`
      INSERT INTO public.secrets (name, value)
      VALUES ($1, $2)
      ON CONFLICT (name) 
      DO UPDATE SET value = $2, updated_at = now();
    `, [`api_key_${serviceName}`, connectionString]);
  } catch (error) {
    console.log('Error guardando credenciales en secrets:', error);
    // No lanzamos el error porque esta operación no es crítica
  }
}

// Función principal para manejar las solicitudes
serve(async (req) => {
  // Manejar solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Verificar header de autorización
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ 
      success: false,
      error: 'No authorization header' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let connection: PoolClient | null = null;
  let pool: Pool | null = null;
  
  try {
    // Obtener parámetros de la solicitud
    const { serviceName }: ServiceNameRequest = await req.json();
    
    // Validar el nombre del servicio
    if (!serviceName || typeof serviceName !== 'string' || serviceName.length < 3) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Nombre de servicio inválido. Debe tener al menos 3 caracteres.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitizar el nombre del servicio
    const sanitizedServiceName = sanitizeServiceName(serviceName);
    
    // Obtener URL de la base de datos desde variables de entorno
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!databaseUrl) {
      throw new Error('URL de la base de datos no encontrada en las variables de entorno');
    }
    
    // Crear pool de conexiones y conectar
    pool = new Pool(databaseUrl, 3); // Limitar a 3 conexiones
    connection = await pool.connect();
    
    // Extraer token JWT y validar
    const token = authHeader.replace('Bearer ', '');
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Formato de token JWT inválido' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extraer ID de usuario del JWT
    let payload;
    try {
      payload = JSON.parse(atob(tokenParts[1]));
    } catch (e) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No se pudo decodificar el payload del JWT' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = payload.sub;
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'ID de usuario no encontrado en el JWT' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el usuario tenga permisos
    const hasPermission = await verifyUserPermissions(connection, userId);
    if (!hasPermission) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Solo propietarios o administradores pueden crear credenciales de API' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Generar contraseña segura
    const password = generateSecurePassword();
    const roleName = `servicios_ro_${sanitizedServiceName}`;
    const userName = `api_${sanitizedServiceName}`;
    
    // Crear rol si no existe
    await connection.queryArray(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) THEN
          EXECUTE 'CREATE ROLE ' || quote_ident($1) || ' NOLOGIN';
        END IF;
      END
      $$;
    `, [roleName]);
    
    // Otorgar permisos al rol
    await connection.queryArray(`
      GRANT USAGE ON SCHEMA public TO ${roleName};
      GRANT SELECT ON public.servicios_custodia TO ${roleName};
    `);
    
    // Crear usuario o actualizar contraseña
    await connection.queryArray(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) THEN
          EXECUTE 'ALTER ROLE ' || quote_ident($1) || ' WITH PASSWORD ' || quote_literal($2);
        ELSE
          EXECUTE 'CREATE ROLE ' || quote_ident($1) || ' LOGIN PASSWORD ' || quote_literal($2);
        END IF;
      END
      $$;
    `, [userName, password]);
    
    // Otorgar rol al usuario
    await connection.queryArray(`
      GRANT ${roleName} TO ${userName};
    `);
    
    // Generar cadena de conexión
    const dbHost = new URL(databaseUrl).hostname;
    const dbPort = new URL(databaseUrl).port || '5432';
    const dbName = new URL(databaseUrl).pathname.substring(1); // Quitar el '/' inicial
    
    const connectionString = `postgresql://${userName}:${password}@${dbHost}:${dbPort}/${dbName}`;
    
    // Guardar la clave de API en la tabla secrets si existe
    await saveCredentialsToSecrets(connection, sanitizedServiceName, connectionString);
    
    // Preparar respuesta exitosa
    const response: ApiCredentialResponse = {
      success: true,
      service_name: sanitizedServiceName,
      user: userName,
      password: password,
      connection_string: connectionString,
      instructions: "Este usuario tiene acceso de SOLO LECTURA a la tabla servicios_custodia.",
      important_note: "Guarde estas credenciales de forma segura. La contraseña no será recuperable después de esta operación."
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error procesando solicitud:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: String(error) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    // Liberar recursos
    if (connection) {
      connection.release();
    }
    if (pool) {
      await pool.end();
    }
  }
});
