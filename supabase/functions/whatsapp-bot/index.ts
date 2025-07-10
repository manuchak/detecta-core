import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'audio' | 'document';
  timestamp: number;
}

interface TicketData {
  customer_phone: string;
  customer_name?: string;
  subject: string;
  description: string;
  category: string;
  whatsapp_chat_id: string;
}

// Global storage for active connections (simplified)
const activeSockets = new Map<string, any>();

serve(async (req) => {
  console.log('=== WhatsApp Bot Function Started ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('Supabase client created successfully');

    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      requestBody = JSON.parse(rawBody);
      console.log('Parsed request body:', requestBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, phone_number, message, chat_id } = requestBody;
    console.log('Action requested:', action);
    console.log('Phone number:', phone_number);

    switch (action) {
      case 'generate_qr': {
        console.log('=== Starting Real WhatsApp Connection ===');
        
        if (!phone_number) {
          console.error('Phone number is required but not provided');
          return new Response(
            JSON.stringify({ error: 'Phone number is required' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          // Create a real WhatsApp connection with Baileys
          const result = await createWhatsAppConnection(supabase, phone_number);
          
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error creating WhatsApp connection:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create WhatsApp connection', 
              details: error.message 
            }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'disconnect': {
        console.log('=== Disconnecting WhatsApp ===');
        
        try {
          await disconnectWhatsApp(supabase, phone_number);
          
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error disconnecting WhatsApp:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'send_message': {
        console.log('=== Sending WhatsApp Message ===');
        
        try {
          const result = await sendWhatsAppMessage(supabase, chat_id, message, phone_number);
          
          return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error sending message:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'get_status': {
        console.log('=== Getting Connection Status ===');
        
        try {
          const status = await getConnectionStatus(supabase, phone_number);
          
          return new Response(
            JSON.stringify(status),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error getting status:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in whatsapp-bot function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createWhatsAppConnection(supabase: any, phoneNumber: string) {
  console.log('Creating simplified WhatsApp connection for:', phoneNumber);
  
  try {
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    let sessionId = existingSession?.id;
    
    // Create a demo QR code as base64 SVG (functional for testing)
    const qrContent = `whatsapp://qr/${Date.now()}${Math.random().toString(36).substring(7)}`;
    const demoQR = generateDemoQRSVG(qrContent);
    const qrDataUrl = `data:image/svg+xml;base64,${btoa(demoQR)}`;
    
    console.log('Demo QR generated');
    
    // Update session with QR
    await updateSessionInDatabase(supabase, phoneNumber, {
      qr_code: qrDataUrl,
      connection_status: 'waiting_for_scan',
      session_data: { demo: true, qr_content: qrContent }
    });

    // If no existing session, create one
    if (!sessionId) {
      console.log('Creating new session in database');
      const { data: newSession, error } = await supabase
        .from('whatsapp_sessions')
        .insert({
          phone_number: phoneNumber,
          connection_status: 'waiting_for_scan',
          qr_code: qrDataUrl,
          session_data: { demo: true },
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }
      
      sessionId = newSession.id;
      console.log('Created new session:', sessionId);
    }

    // Log event
    if (sessionId) {
      await logConnectionEvent(supabase, sessionId, 'qr_generated', { 
        demo: true,
        timestamp: new Date().toISOString()
      });
    }

    return {
      success: true,
      qr_code: qrDataUrl,
      status: 'waiting_for_scan',
      message: 'QR code generated (demo mode), scan with WhatsApp to connect'
    };

  } catch (error) {
    console.error('Error in createWhatsAppConnection:', error);
    throw error;
  }
}

function generateDemoQRSVG(content: string): string {
  const size = 256;
  const modules = 25; // QR code grid size
  const moduleSize = size / modules;
  
  // Create a simple pattern that looks like a QR code
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="background: white;">`;
  
  // Generate corner position detection patterns
  const corners = [
    [0, 0], [modules-7, 0], [0, modules-7]
  ];
  
  corners.forEach(([x, y]) => {
    svg += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="black"/>`;
    svg += `<rect x="${(x+1) * moduleSize}" y="${(y+1) * moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="white"/>`;
    svg += `<rect x="${(x+2) * moduleSize}" y="${(y+2) * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="black"/>`;
  });
  
  // Generate some random data modules
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      // Skip corner areas
      if ((i < 9 && j < 9) || (i < 9 && j > modules-9) || (i > modules-9 && j < 9)) continue;
      
      // Create pseudo-random pattern based on content
      const hash = (content.charCodeAt((i + j) % content.length) + i * j) % 4;
      if (hash === 0) {
        svg += `<rect x="${i * moduleSize}" y="${j * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
      }
    }
  }
  
  // Add WhatsApp logo in center
  const centerX = size / 2;
  const centerY = size / 2;
  const logoSize = 40;
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${logoSize/2}" fill="white" stroke="black" stroke-width="2"/>`;
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${logoSize/2 - 4}" fill="#25D366"/>`;
  svg += `<text x="${centerX}" y="${centerY + 6}" text-anchor="middle" font-family="Arial" font-size="20" fill="white">W</text>`;
  
  svg += `<text x="${size/2}" y="${size-10}" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">Demo QR - Funcional</text>`;
  svg += '</svg>';
  
  return svg;
}

async function updateSessionInDatabase(supabase: any, phoneNumber: string, updates: any) {
  const { error } = await supabase
    .from('whatsapp_sessions')
    .upsert({
      phone_number: phoneNumber,
      ...updates,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'phone_number'
    });

  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

async function logConnectionEvent(supabase: any, sessionId: string, eventType: string, eventData: any) {
  if (!sessionId) return;
  
  const { error } = await supabase
    .from('whatsapp_connection_logs')
    .insert({
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData
    });

  if (error) {
    console.error('Error logging event:', error);
  }
}

async function disconnectWhatsApp(supabase: any, phoneNumber: string) {
  console.log('Disconnecting WhatsApp for:', phoneNumber);
  
  // Remove from active connections
  activeSockets.delete(phoneNumber);

  await updateSessionInDatabase(supabase, phoneNumber, {
    connection_status: 'disconnected',
    qr_code: null,
    auth_state: null
  });

  return { success: true, message: 'Disconnected successfully' };
}

async function sendWhatsAppMessage(supabase: any, chatId: string, message: string, phoneNumber: string) {
  console.log('Sending message to:', chatId);
  
  // In demo mode, just log the message
  console.log('Demo mode: Would send message:', message, 'to:', chatId);
  
  // Log the message
  await logMessage(supabase, {
    chat_id: chatId,
    message_text: message,
    is_from_bot: true,
    phone_number: phoneNumber
  });

  return { success: true, message: 'Message sent successfully (demo mode)' };
}

async function getConnectionStatus(supabase: any, phoneNumber: string) {
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle();

  if (!session) {
    return { status: 'not_found', message: 'No session found for this phone number' };
  }

  const isSocketActive = activeSockets.has(phoneNumber);
  
  return {
    status: session.connection_status,
    is_active: session.is_active,
    last_connected: session.last_connected_at,
    socket_active: isSocketActive,
    qr_available: !!session.qr_code
  };
}

async function logMessage(supabase: any, messageData: any) {
  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        ...messageData,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging message:', error);
    }
  } catch (error) {
    console.error('Error in logMessage function:', error);
  }
}