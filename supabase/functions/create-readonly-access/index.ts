
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
 * Verifica que el usuario tiene los permisos necesarios mediante una función segura
 * que evita problemas de recursión con RLS
 */
async function verifyUserPermissions(connection: PoolClient, userId: string): Promise<boolean> {
  try {
    // Usamos una consulta directa para evitar problemas de recursión RLS
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
      console.log('No se encontró rol para el usuario:', userId);
      return false;
    }
    
    const userRole = userRoleResult.rows[0].role as string;
    console.log('Rol del usuario:', userRole);
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
  if (!serviceName || typeof serviceName !== 'string') {
    return 'default_service';
  }
  
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 30) || 'default_service';
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
    // Comprobamos primero si la tabla existe
    const tableExists = await connection.queryArray(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'secrets'
      );
    `);
    
    if (!tableExists.rows[0][0]) {
      console.log('La tabla secrets no existe, omitiendo guardado de credenciales');
      return;
    }

    await connection.queryArray(`
      INSERT INTO public.secrets (name, value)
      VALUES ($1, $2)
      ON CONFLICT (name) 
      DO UPDATE SET value = $2, updated_at = now();
    `, [`api_key_${serviceName}`, connectionString]);
    
    console.log('Credenciales guardadas exitosamente en tabla secrets');
  } catch (error) {
    console.error('Error guardando credenciales en secrets:', error);
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
    let serviceName: string;
    try {
      const requestData = await req.json() as ServiceNameRequest;
      serviceName = requestData.serviceName;
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Error al procesar la solicitud: ' + error.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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

    console.log('Verificando permisos para el usuario:', userId);

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
    
    console.log('Permiso verificado, creando credenciales para:', sanitizedServiceName);
    
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
    
    console.log('Rol creado o verificado:', roleName);
    
    try {
      // Otorgar permisos al rol de forma segura
      await connection.queryArray(`
        GRANT USAGE ON SCHEMA public TO ${roleName};
      `);
      
      await connection.queryArray(`
        GRANT SELECT ON public.servicios_custodia TO ${roleName};
      `);
      
      console.log('Permisos otorgados al rol');
    } catch (error) {
      console.error('Error al otorgar permisos al rol:', error);
      throw new Error(`Error al otorgar permisos: ${error.message}`);
    }
    
    try {
      // Crear usuario o actualizar contraseña
      await connection.queryArray(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) THEN
            EXECUTE 'ALTER ROLE ' || quote_ident($1) || ' WITH PASSWORD ' || quote_literal($2) || ' LOGIN';
          ELSE
            EXECUTE 'CREATE ROLE ' || quote_ident($1) || ' LOGIN PASSWORD ' || quote_literal($2);
          END IF;
        END
        $$;
      `, [userName, password]);
      
      console.log('Usuario creado o actualizado:', userName);
    } catch (error) {
      console.error('Error al crear/actualizar usuario:', error);
      throw new Error(`Error al crear o actualizar usuario: ${error.message}`);
    }
    
    try {
      // Otorgar rol al usuario
      await connection.queryArray(`
        GRANT ${roleName} TO ${userName};
      `);
      
      console.log('Rol otorgado al usuario');
    } catch (error) {
      console.error('Error al otorgar rol al usuario:', error);
      throw new Error(`Error al otorgar rol al usuario: ${error.message}`);
    }
    
    // Generar cadena de conexión
    const dbHost = new URL(databaseUrl).hostname;
    const dbPort = new URL(databaseUrl).port || '5432';
    const dbName = new URL(databaseUrl).pathname.substring(1); // Quitar el '/' inicial
    
    const connectionString = `postgresql://${userName}:${password}@${dbHost}:${dbPort}/${dbName}`;
    
    // Por seguridad, no almacenamos credenciales generadas automáticamente en tablas públicas
    // Si necesita persistir, use Secrets/Vault de Supabase desde el dashboard.
    // await saveCredentialsToSecrets(connection, sanitizedServiceName, connectionString);
    
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
