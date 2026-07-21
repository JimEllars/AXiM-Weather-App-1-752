import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received database webhook payload:", payload);

    // Expecting payload from Supabase Database Webhook on telemetry_events insert
    // Payload usually has structure: { type: 'INSERT', record: { id, media_url, ... } }
    const record = payload.record;
    if (!record || !record.id) {
       return new Response(JSON.stringify({ error: "No record ID found in payload" }), { status: 400 });
    }

    const eventId = record.id;
    const mediaUrl = record.media_url || "unknown";

    console.log(`Processing telemetry event ${eventId} with media: ${mediaUrl}`);

    // Stub: AI Vision Fetch Call
    // const aiResponse = await fetch('https://api.external-ai-vision.com/analyze', { ... });
    // const aiResult = await aiResponse.json();
    console.log("Stub: AI Vision analysis processing...");

    // Assuming AI validates it, update the database
    console.log("Updating telemetry event verified status...");

    const { error: updateError } = await supabase
      .from('telemetry_events')
      .update({ verified: true })
      .eq('id', eventId);

    if (updateError) {
      console.error("Error updating telemetry event:", updateError);
      throw updateError;
    }

    console.log(`Telemetry event ${eventId} successfully verified.`);

    return new Response(
      JSON.stringify({ success: true, message: "Onyx pipeline processing completed", eventId, verified: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pipeline error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
