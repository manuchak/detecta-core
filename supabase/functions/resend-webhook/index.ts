import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      message: string;
      type: 'hard' | 'soft';
    };
  };
}

// Verify Svix/Resend webhook signature using HMAC-SHA256
async function verifyWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');
  
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers for signature verification');
    return false;
  }

  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not configured - skipping signature verification');
    // Return true to allow webhook processing if secret is not configured
    // This enables gradual rollout of signature verification
    return true;
  }

  // Verify timestamp to prevent replay attacks (max 5 minutes difference)
  const timestampSeconds = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(now - timestampSeconds);
  
  if (timeDifference > 300) {
    console.error(`Webhook timestamp too old or in future: ${timeDifference}s difference`);
    return false;
  }

  try {
    // Construct signed content: svix_id.svix_timestamp.body
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
    
    // Extract base64 part of secret (after "whsec_" prefix)
    const secretKey = secret.startsWith('whsec_') 
      ? secret.slice(6) 
      : secret;
    
    // Decode secret from base64
    const secretBytes = Uint8Array.from(
      atob(secretKey), 
      c => c.charCodeAt(0)
    );
    
    // Import key for HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Calculate HMAC-SHA256 signature
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signedContent)
    );
    
    // Convert to base64
    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBytes))
    );
    
    // Compare with sent signatures (format: "v1,signature1 v1,signature2")
    const signatures = svixSignature.split(' ');
    for (const sig of signatures) {
      const [version, signature] = sig.split(',');
      if (version === 'v1' && signature === expectedSignature) {
        console.log('Webhook signature verified successfully');
        return true;
      }
    }
    
    console.error('Webhook signature verification failed - no matching signature');
    return false;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read body as text for signature verification
    const payload = await req.text();
    
    // Verify signature BEFORE processing
    const isValid = await verifyWebhookSignature(payload, req.headers);
    
    if (!isValid) {
      console.error('Invalid webhook signature - rejecting request');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse JSON after signature verification
    const event: ResendWebhookEvent = JSON.parse(payload);
    
    console.log(`Received Resend webhook event: ${event.type}`, {
      email_id: event.data.email_id,
      to: event.data.to,
    });

    const emailId = event.data.email_id;
    
    // Map Resend event types to our delivery_status
    let deliveryStatus: string;
    let bounceType: string | null = null;
    let bounceReason: string | null = null;

    switch (event.type) {
      case 'email.sent':
        deliveryStatus = 'sent';
        break;
      case 'email.delivered':
        deliveryStatus = 'delivered';
        break;
      case 'email.bounced':
        deliveryStatus = 'bounced';
        bounceType = event.data.bounce?.type || 'hard';
        bounceReason = event.data.bounce?.message || 'Unknown bounce reason';
        break;
      case 'email.complained':
        deliveryStatus = 'complained';
        break;
      case 'email.opened':
        deliveryStatus = 'opened';
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Update the invitation record
    const { data, error } = await supabase
      .from('custodian_invitations')
      .update({
        delivery_status: deliveryStatus,
        bounce_type: bounceType,
        bounce_reason: bounceReason,
        delivery_updated_at: new Date().toISOString(),
      })
      .eq('resend_email_id', emailId)
      .select('id, batch_id')
      .single();

    if (error) {
      console.error('Error updating invitation:', error);
      // Don't throw - we still want to acknowledge the webhook
    } else {
      console.log(`Updated invitation ${data.id} with status: ${deliveryStatus}`);
      
      // Update batch stats if this invitation belongs to a batch
      if (data.batch_id) {
        const { error: batchError } = await supabase
          .rpc('update_batch_stats', { p_batch_id: data.batch_id });
        
        if (batchError) {
          console.error('Error updating batch stats:', batchError);
        }
      }
    }

    return new Response(JSON.stringify({ received: true, status: deliveryStatus }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
