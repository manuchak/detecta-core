
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
    // Parse the request body
    const { role, permissionType, permissionId, allowed } = await req.json();
    
    // Input validation
    if (!role || typeof role !== 'string' || 
        !permissionType || typeof permissionType !== 'string' || 
        !permissionId || typeof permissionId !== 'string' ||
        typeof allowed !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Invalid permission parameters provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Attempting to add permission: ${role}.${permissionType}.${permissionId}=${allowed}`);
    
    // Direct database connection to avoid RLS recursion issues
    const databaseUrl = Deno.env.get('SUPABASE_DB_URL') ?? '';
    if (!databaseUrl) {
      throw new Error('Database URL not found in environment');
    }
    
    const pool = new Pool(databaseUrl, 3); // Limit to 3 connections
    const connection = await pool.connect();
    
    try {
      // Extract JWT token and get user_id
      const token = authHeader.replace('Bearer ', '');
      
      // First, verify if the user has owner role
      const userRoleResult = await connection.queryObject`
        SELECT ur.role 
        FROM user_roles ur 
        WHERE ur.user_id = (
          SELECT sub FROM auth.users 
          WHERE id = (
            SELECT auth.uid()
          )
          LIMIT 1
        )
        ORDER BY 
          CASE ur.role
            WHEN 'owner' THEN 1
            WHEN 'admin' THEN 2
            ELSE 3
          END
        LIMIT 1
      `;
      
      if (userRoleResult.rows.length === 0 || (userRoleResult.rows[0].role !== 'owner' && userRoleResult.rows[0].role !== 'admin')) {
        return new Response(JSON.stringify({ error: 'Only owner or admin can create permissions' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check if the permission already exists
      const checkResult = await connection.queryObject`
        SELECT id FROM role_permissions 
        WHERE role = ${role} 
        AND permission_type = ${permissionType} 
        AND permission_id = ${permissionId}
        LIMIT 1
      `;
      
      if (checkResult.rows.length > 0) {
        return new Response(JSON.stringify({ error: 'Permission already exists', id: checkResult.rows[0].id }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Insert the new permission directly
      const insertResult = await connection.queryObject`
        INSERT INTO role_permissions (role, permission_type, permission_id, allowed)
        VALUES (${role}, ${permissionType}, ${permissionId}, ${allowed})
        RETURNING id
      `;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          id: insertResult.rows[0].id,
          message: `Permission added successfully: ${role}.${permissionType}.${permissionId}=${allowed}`  
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
