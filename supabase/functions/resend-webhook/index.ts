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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const event: ResendWebhookEvent = await req.json();
    
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
