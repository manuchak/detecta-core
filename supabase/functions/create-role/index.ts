
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
    const { new_role } = await req.json();
    
    // Input validation
    if (!new_role || typeof new_role !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid role name provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the role name (ensure it's lowercase with no spaces)
    const validRoleName = new_role.toLowerCase().replace(/\s+/g, '_');
    
    console.log(`Attempting to create role: ${validRoleName}`);
    
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
          SELECT sub FROM auth.jwt_claims 
          WHERE token = ${token} 
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
      
      if (userRoleResult.rows.length === 0 || userRoleResult.rows[0].role !== 'owner') {
        return new Response(JSON.stringify({ error: 'Only owner can create roles' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check if the role already exists
      const checkResult = await connection.queryObject`
        SELECT role FROM role_permissions WHERE role = ${validRoleName} LIMIT 1
      `;
      
      if (checkResult.rows.length > 0) {
        return new Response(JSON.stringify({ error: 'Role already exists' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Insert directly into role_permissions table with default permissions
      await connection.queryArray`
        INSERT INTO role_permissions (role, permission_type, permission_id, allowed)
        VALUES 
          (${validRoleName}, 'page', 'dashboard', true),
          (${validRoleName}, 'page', 'profile', true)
      `;
      
      // Insert a placeholder entry in user_roles to register the role
      // Using a special UUID that won't match any real user
      await connection.queryArray`
        INSERT INTO user_roles (user_id, role)
        VALUES ('00000000-0000-0000-0000-000000000000', ${validRoleName})
      `;
      
      return new Response(JSON.stringify({ success: true, role: validRoleName }), {
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
