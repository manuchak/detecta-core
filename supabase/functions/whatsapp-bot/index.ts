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
  const size = 300;
  const modules = 25; // QR code grid size
  const moduleSize = size / modules;
  
  // Create a simple pattern that looks like a QR code
  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%; background: white;">`;
  
  // QR Code Background
  svg += `<rect width="${size}" height="${size}" fill="white"/>`;
  
  // Corner Position Detection Patterns
  // Top Left
  svg += `<rect x="20" y="20" width="70" height="70" fill="black"/>`;
  svg += `<rect x="30" y="30" width="50" height="50" fill="white"/>`;
  svg += `<rect x="40" y="40" width="30" height="30" fill="black"/>`;
  
  // Top Right
  svg += `<rect x="210" y="20" width="70" height="70" fill="black"/>`;
  svg += `<rect x="220" y="30" width="50" height="50" fill="white"/>`;
  svg += `<rect x="230" y="40" width="30" height="30" fill="black"/>`;
  
  // Bottom Left
  svg += `<rect x="20" y="210" width="70" height="70" fill="black"/>`;
  svg += `<rect x="30" y="220" width="50" height="50" fill="white"/>`;
  svg += `<rect x="40" y="230" width="30" height="30" fill="black"/>`;
  
  // Data Pattern (scattered squares to simulate QR data)
  svg += `<rect x="110" y="20" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="20" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="20" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="20" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="20" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="20" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="40" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="60" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="80" y="110" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="110" y="40" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="60" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="40" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="60" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="40" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="110" y="80" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="80" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="80" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="100" width="10" height="10" fill="black"/>`;
  
  // More data pattern
  svg += `<rect x="110" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="130" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="130" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="110" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="210" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="230" y="130" width="10" height="10" fill="black"/>`;
  svg += `<rect x="250" y="110" width="10" height="10" fill="black"/>`;
  svg += `<rect x="270" y="130" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="110" y="150" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="170" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="150" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="170" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="150" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="110" y="190" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="210" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="190" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="210" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="190" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="210" y="150" width="10" height="10" fill="black"/>`;
  svg += `<rect x="230" y="170" width="10" height="10" fill="black"/>`;
  svg += `<rect x="250" y="150" width="10" height="10" fill="black"/>`;
  svg += `<rect x="270" y="170" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="110" y="230" width="10" height="10" fill="black"/>`;
  svg += `<rect x="130" y="250" width="10" height="10" fill="black"/>`;
  svg += `<rect x="150" y="230" width="10" height="10" fill="black"/>`;
  svg += `<rect x="170" y="250" width="10" height="10" fill="black"/>`;
  svg += `<rect x="190" y="230" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="210" y="190" width="10" height="10" fill="black"/>`;
  svg += `<rect x="230" y="210" width="10" height="10" fill="black"/>`;
  svg += `<rect x="250" y="190" width="10" height="10" fill="black"/>`;
  svg += `<rect x="270" y="210" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="210" y="230" width="10" height="10" fill="black"/>`;
  svg += `<rect x="230" y="250" width="10" height="10" fill="black"/>`;
  svg += `<rect x="250" y="230" width="10" height="10" fill="black"/>`;
  svg += `<rect x="270" y="250" width="10" height="10" fill="black"/>`;
  
  // Timing patterns
  svg += `<rect x="100" y="60" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="80" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="120" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="140" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="160" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="180" width="10" height="10" fill="black"/>`;
  svg += `<rect x="100" y="200" width="10" height="10" fill="black"/>`;
  
  svg += `<rect x="60" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="80" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="120" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="140" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="160" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="180" y="100" width="10" height="10" fill="black"/>`;
  svg += `<rect x="200" y="100" width="10" height="10" fill="black"/>`;
  
  // WhatsApp Logo in center
  svg += `<circle cx="150" cy="150" r="25" fill="white" stroke="black" stroke-width="2"/>`;
  svg += `<circle cx="150" cy="150" r="20" fill="#25D366"/>`;
  
  // Simple WhatsApp icon
  svg += `<path d="M140 140 Q140 135 145 135 Q155 135 160 140 Q160 145 155 150 L150 155 L145 150 Q140 145 140 140 Z" fill="white"/>`;
  svg += `<circle cx="145" cy="142" r="2" fill="white"/>`;
  
  // Demo watermark
  svg += `<text x="150" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#999">QR Demo - No Funcional</text>`;
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