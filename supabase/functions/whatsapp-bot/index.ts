import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Import Baileys for real WhatsApp integration
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  makeInMemoryStore,
  ConnectionState,
  AuthState,
  WASocket,
  BaileysEventMap
} from "https://esm.sh/@whiskeysockets/baileys@6.6.0";
import { Boom } from "https://esm.sh/@hapi/boom@10.0.1";
import QRCode from "https://esm.sh/qrcode@1.5.3";

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

// Global storage for active sockets
const activeSockets = new Map<string, WASocket>();
const store = makeInMemoryStore({});

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
  console.log('Creating WhatsApp connection for:', phoneNumber);
  
  try {
    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    let sessionId = existingSession?.id;
    let authState: AuthState;
    
    if (existingSession?.auth_state) {
      console.log('Loading existing auth state');
      authState = existingSession.auth_state;
    } else {
      console.log('Creating new auth state');
      // For demo purposes, we'll create a simple auth state structure
      authState = {
        creds: {},
        keys: {}
      } as any;
    }

    // Create the socket connection
    const socket = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent' } as any)
      } as any,
      generateHighQualityLinkPreview: true,
    });

    // Store the socket for later use
    activeSockets.set(phoneNumber, socket);

    let qrCode = '';
    let connectionPromise: Promise<any>;

    // Handle connection events
    connectionPromise = new Promise((resolve, reject) => {
      socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        console.log('Connection update:', update);
        
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          console.log('QR Code received, generating image...');
          try {
            // Generate real QR code as base64 image
            const qrImageData = await QRCode.toDataURL(qr, {
              width: 256,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            
            qrCode = qrImageData;
            console.log('QR code generated successfully');
            
            // Update session with QR
            await updateSessionInDatabase(supabase, phoneNumber, {
              qr_code: qrCode,
              connection_status: 'waiting_for_scan',
              session_data: { lastQR: qr }
            });

            // Log event
            await logConnectionEvent(supabase, sessionId, 'qr_generated', { qr: qr.substring(0, 50) + '...' });
            
          } catch (qrError) {
            console.error('Error generating QR code:', qrError);
            reject(qrError);
          }
        }
        
        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
          
          await updateSessionInDatabase(supabase, phoneNumber, {
            connection_status: 'disconnected',
            qr_code: null
          });

          await logConnectionEvent(supabase, sessionId, 'disconnected', { 
            reason: (lastDisconnect?.error as any)?.message || 'Unknown',
            shouldReconnect 
          });
          
          activeSockets.delete(phoneNumber);
          
          if (!shouldReconnect) {
            reject(new Error('Logged out from WhatsApp'));
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connection opened successfully');
          
          // Save auth state to database
          await updateSessionInDatabase(supabase, phoneNumber, {
            connection_status: 'connected',
            last_connected_at: new Date().toISOString(),
            auth_state: socket.authState,
            qr_code: null
          });

          await logConnectionEvent(supabase, sessionId, 'connected', { 
            user: socket.user?.id || 'Unknown' 
          });
          
          resolve({
            success: true,
            status: 'connected',
            message: 'WhatsApp connected successfully',
            user: socket.user
          });
        }
      });

      // Handle incoming messages
      socket.ev.on('messages.upsert', async (m) => {
        console.log('New messages:', m);
        
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            await processIncomingMessage(supabase, socket, msg);
          }
        }
      });

      // Timeout after 60 seconds if no connection
      setTimeout(() => {
        if (qrCode) {
          resolve({
            success: true,
            qr_code: qrCode,
            status: 'waiting_for_scan',
            message: 'QR code generated, scan with WhatsApp to connect'
          });
        } else {
          reject(new Error('Connection timeout - no QR code generated'));
        }
      }, 60000);
    });

    // If no existing session, create one
    if (!sessionId) {
      const { data: newSession, error } = await supabase
        .from('whatsapp_sessions')
        .insert({
          phone_number: phoneNumber,
          connection_status: 'connecting',
          auth_state: authState
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

    return await connectionPromise;

  } catch (error) {
    console.error('Error in createWhatsAppConnection:', error);
    throw error;
  }
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
  
  const socket = activeSockets.get(phoneNumber);
  if (socket) {
    await socket.logout();
    activeSockets.delete(phoneNumber);
  }

  await updateSessionInDatabase(supabase, phoneNumber, {
    connection_status: 'disconnected',
    qr_code: null,
    auth_state: null
  });

  return { success: true, message: 'Disconnected successfully' };
}

async function sendWhatsAppMessage(supabase: any, chatId: string, message: string, phoneNumber: string) {
  console.log('Sending message to:', chatId);
  
  const socket = activeSockets.get(phoneNumber);
  if (!socket) {
    throw new Error('WhatsApp not connected for this phone number');
  }

  try {
    const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
    await socket.sendMessage(jid, { text: message });
    
    // Log the message
    await logMessage(supabase, {
      chat_id: chatId,
      message_text: message,
      is_from_bot: true,
      phone_number: phoneNumber
    });

    return { success: true, message: 'Message sent successfully' };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function getConnectionStatus(supabase: any, phoneNumber: string) {
  const { data: session } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

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

async function processIncomingMessage(supabase: any, socket: WASocket, msg: any) {
  console.log('Processing incoming message:', msg);

  try {
    const chatId = msg.key.remoteJid;
    const messageText = msg.message?.conversation || 
                       msg.message?.extendedTextMessage?.text || 
                       '';

    if (!messageText) return;

    // Log the incoming message
    await logMessage(supabase, {
      chat_id: chatId,
      message_text: messageText,
      is_from_bot: false,
      phone_number: socket.user?.id || 'unknown'
    });

    // Get WhatsApp configuration for auto-replies
    const { data: config } = await supabase
      .from('whatsapp_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config?.auto_reply_enabled) return;

    // Check business hours
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const isBusinessHours = currentTime >= config.business_hours_start && 
                           currentTime <= config.business_hours_end;

    let replyText = '';

    if (!isBusinessHours) {
      replyText = `Gracias por contactarnos. Nuestro horario de atención es de ${config.business_hours_start} a ${config.business_hours_end}. Te responderemos tan pronto como sea posible.`;
    } else {
      // Process message content for auto-replies
      const msgLower = messageText.toLowerCase().trim();
      
      if (msgLower.includes('hola') || msgLower.includes('ayuda')) {
        replyText = config.welcome_message || 'Hola! ¿En qué podemos ayudarte?';
      } else if (msgLower.includes('precio') || msgLower.includes('costo')) {
        replyText = 'Para información sobre precios, un ejecutivo se pondrá en contacto contigo pronto.';
      } else if (msgLower.includes('servicio') || msgLower.includes('producto')) {
        replyText = 'Ofrecemos servicios de monitoreo GPS y custodia. ¿Te interesa algún servicio en particular?';
      }
    }

    // Send auto-reply if we have one
    if (replyText) {
      await socket.sendMessage(chatId, { text: replyText });
      
      // Log the reply
      await logMessage(supabase, {
        chat_id: chatId,
        message_text: replyText,
        is_from_bot: true,
        phone_number: socket.user?.id || 'unknown'
      });
    }

  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function logMessage(supabase: any, messageData: any) {
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      ...messageData,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error logging message:', error);
  }
}