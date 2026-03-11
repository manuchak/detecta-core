import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const KAPSO_BASE_URL = 'https://api.kapso.ai/meta/whatsapp/v24.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY');
    if (!KAPSO_API_KEY) {
      throw new Error('KAPSO_API_KEY is not configured');
    }

    const KAPSO_PHONE_NUMBER_ID = Deno.env.get('KAPSO_PHONE_NUMBER_ID');
    if (!KAPSO_PHONE_NUMBER_ID) {
      throw new Error('KAPSO_PHONE_NUMBER_ID is not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { media_id, servicio_id, whatsapp_message_id, media_type } = await req.json();

    if (!media_id) {
      throw new Error('media_id is required');
    }

    console.log(`📥 Downloading media ${media_id} for service ${servicio_id}`);

    // Step 1: Get media URL from Kapso/Meta API
    const mediaInfoRes = await fetch(
      `${KAPSO_BASE_URL}/${media_id}?phone_number_id=${KAPSO_PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${KAPSO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mediaInfoRes.ok) {
      const errorBody = await mediaInfoRes.text();
      throw new Error(`Kapso media info failed [${mediaInfoRes.status}]: ${errorBody}`);
    }

    const mediaInfo = await mediaInfoRes.json();
    const downloadUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type || 'image/jpeg';

    if (!downloadUrl) {
      throw new Error(`No download URL returned for media ${media_id}`);
    }

    console.log(`📎 Media URL obtained, mime: ${mimeType}, downloading binary...`);

    // Step 2: Download the binary from the temporary URL
    const binaryRes = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${KAPSO_API_KEY}`,
      },
    });

    if (!binaryRes.ok) {
      const errorBody = await binaryRes.text();
      throw new Error(`Media binary download failed [${binaryRes.status}]: ${errorBody}`);
    }

    const binary = await binaryRes.arrayBuffer();
    const fileSize = binary.byteLength;

    // Determine file extension from mime type
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    };
    const ext = extMap[mimeType] || 'bin';
    const timestamp = Date.now();
    const storagePath = `${servicio_id}/${timestamp}_${media_id.slice(-8)}.${ext}`;

    console.log(`💾 Uploading ${fileSize} bytes to whatsapp-media/${storagePath}`);

    // Step 3: Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(storagePath, binary, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Step 4: Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('whatsapp-media')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    console.log(`✅ Media uploaded: ${publicUrl}`);

    // Step 5: Insert record in servicio_comm_media
    const detectedType = mimeType.startsWith('image/') ? 'image' 
      : mimeType.startsWith('video/') ? 'video'
      : mimeType.startsWith('audio/') ? 'audio'
      : 'document';

    const { data: commMedia, error: insertError } = await supabase
      .from('servicio_comm_media')
      .insert({
        servicio_id: servicio_id,
        whatsapp_message_id: whatsapp_message_id || null,
        storage_path: storagePath,
        media_type: media_type || detectedType,
        original_media_id: media_id,
        validado: false,
        enviado_a_cliente: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting servicio_comm_media:', insertError);
    }

    // Step 6: Update the whatsapp_message media_url with the public URL
    if (whatsapp_message_id) {
      await supabase
        .from('whatsapp_messages')
        .update({ media_url: publicUrl })
        .eq('id', whatsapp_message_id);
    }

    return new Response(JSON.stringify({
      success: true,
      storage_path: storagePath,
      public_url: publicUrl,
      media_type: detectedType,
      file_size: fileSize,
      comm_media_id: commMedia?.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error in kapso-download-media:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
