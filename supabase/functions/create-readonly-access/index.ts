
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';

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

  try {
    // Get request parameters
    const { serviceName } = await req.json();
    
    if (!serviceName || typeof serviceName !== 'string' || serviceName.length < 3) {
      return new Response(JSON.stringify({ error: 'Invalid service name provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize the service name to prevent SQL injection
    const sanitizedServiceName = serviceName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 30);
    
    // Direct database connection using SUPABASE_DB_URL
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!databaseUrl) {
      throw new Error('Database URL not found in environment');
    }
    
    const pool = new Pool(databaseUrl, 3); // Limit to 3 connections
    const connection = await pool.connect();
    
    try {
      // Extract JWT claims from the authorization header
      const token = authHeader.replace('Bearer ', '');
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return new Response(JSON.stringify({ error: 'Invalid JWT token format' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Extract user ID from JWT payload
      let payload;
      try {
        payload = JSON.parse(atob(tokenParts[1]));
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Could not decode JWT payload' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = payload.sub;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID not found in JWT' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if the user has owner role
      // Fix: Use text parameters with proper placeholders
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
      
      if (userRoleResult.rows.length === 0 || 
          (userRoleResult.rows[0].role !== 'owner' && userRoleResult.rows[0].role !== 'admin')) {
        return new Response(JSON.stringify({ error: 'Only owner or admin can create API credentials' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Generate a random strong password
      const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let result = '';
        const length = 24;
        
        const randomValues = new Uint8Array(length);
        crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < length; i++) {
          result += chars.charAt(randomValues[i] % chars.length);
        }
        
        return result;
      };
      
      const password = generatePassword();
      const roleName = `servicios_ro_${sanitizedServiceName}`;
      const userName = `api_${sanitizedServiceName}`;
      
      // Create role if not exists
      // Fix: Use SQL string literals rather than template literals for SQL
      await connection.queryArray(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) THEN
            EXECUTE 'CREATE ROLE ' || quote_ident($1) || ' NOLOGIN';
          END IF;
        END
        $$;
      `, [roleName]);
      
      // Grant permissions to the role
      await connection.queryArray(`
        GRANT USAGE ON SCHEMA public TO ${roleName};
        GRANT SELECT ON public.servicios_custodia TO ${roleName};
      `);
      
      // Create user if not exists, otherwise reset password
      // Fix: Use parameterized queries appropriately
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
      
      // Grant role to user
      await connection.queryArray(`
        GRANT ${roleName} TO ${userName};
      `);
      
      // Generate connection string
      const dbHost = new URL(databaseUrl).hostname;
      const dbPort = new URL(databaseUrl).port || '5432';
      const dbName = new URL(databaseUrl).pathname.substring(1); // Remove leading '/'
      
      const connectionString = `postgresql://${userName}:${password}@${dbHost}:${dbPort}/${dbName}`;
      
      // Create API key record in secrets table if it exists
      try {
        await connection.queryArray(`
          INSERT INTO public.secrets (name, value)
          VALUES ($1, $2)
          ON CONFLICT (name) 
          DO UPDATE SET value = $2, updated_at = now();
        `, [`api_key_${sanitizedServiceName}`, connectionString]);
      } catch (e) {
        console.log('Secrets table may not exist, skipping record creation:', e);
      }
      
      return new Response(JSON.stringify({
        success: true,
        service_name: sanitizedServiceName,
        user: userName,
        password: password,
        connection_string: connectionString,
        instructions: "This user has READ ONLY access to the servicios_custodia table.",
        important_note: "Save these credentials securely. The password will not be retrievable after this."
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      // Clean up resources
      connection.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
