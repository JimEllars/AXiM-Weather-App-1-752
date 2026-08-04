import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchWithRetry(url: string, options: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = Math.pow(2, attempt) * 500;
      console.log(`Fetch failed. Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received database webhook payload:", payload);

    const record = payload.record;
    if (!record || !record.id) {
       return new Response(JSON.stringify({ error: "No record ID found in payload" }), { status: 400 });
    }

    const eventId = record.id;
    const mediaUrl = record.media_url || "unknown";

    console.log(`Processing telemetry event ${eventId} with media: ${mediaUrl}`);

    console.log("Initiating AI Vision analysis...");

    let isVerified = false;
    let severity = "needs_manual_review";
    let status = "needs_manual_review";
    let summary = null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const accountId = Deno.env.get("CF_ACCOUNT_ID") || "YOUR_ACCOUNT_ID";
      const aiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/llava-hf/llava-1.5-7b-hf`;

      const aiResponse = await fetchWithRetry(aiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('CF_AI_API_TOKEN')}`
        },
        body: JSON.stringify({
          prompt: "Analyze this image and assess the severity of the weather event. You must strictly output a raw JSON object with exactly three keys: 'verified' (boolean, true if severe weather is clearly visible), 'severity' (string, one of 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', or 'NEEDS_MANUAL_REVIEW'), and 'summary' (string, a brief 1-2 sentence human-readable damage or threat assessment). Do not output markdown, just the JSON.",
          image: [],
          messages: [
            {
              role: "user",
              content: `Analyze this image: ${mediaUrl}. Assess the severity of the weather event. You must strictly output a raw JSON object with exactly three keys: 'verified' (boolean, true if severe weather is clearly visible), 'severity' (string, one of 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', or 'NEEDS_MANUAL_REVIEW'), and 'summary' (string, a brief 1-2 sentence human-readable damage or threat assessment). Do not output markdown, just the JSON.`
            }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const aiResult = await aiResponse.json();

      if (aiResult.result && aiResult.result.response) {
          try {
              let responseText = aiResult.result.response.trim();
              if (responseText.startsWith("```json")) {
                  responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
              }
              const parsedResponse = JSON.parse(responseText);
              isVerified = parsedResponse.verified || false;
              severity = parsedResponse.severity || 'needs_manual_review';
              summary = parsedResponse.summary || null;
              status = isVerified ? 'verified' : 'needs_manual_review';
          } catch(parseError) {
              console.error("Failed to parse AI response JSON:", parseError);
          }
      }

    } catch (fetchError) {
       clearTimeout(timeout);
       if (fetchError.name === 'AbortError') {
           console.error("AI Vision analysis timed out after 15 seconds.");
       } else {
           console.error("AI Vision analysis failed after retries:", fetchError);
       }
       isVerified = false;
       severity = "needs_manual_review";
       status = "needs_manual_review";
    }

    console.log(`Updating telemetry event status to: ${status}`);

    const updatePayload: any = { verified: isVerified, severity: severity, status: status };
    // Assuming summary is a column, or metadata depending on schema.
    // If column doesn't exist yet, we could put it in a metadata jsonb, but we'll try to set it directly for the prompt's request.
    if (summary) updatePayload.summary = summary;

    const { error: updateError } = await supabase
      .from('telemetry_events')
      .update(updatePayload)
      .eq('id', eventId);

    if (updateError) {
      console.error("Error updating telemetry event:", updateError);
      throw updateError;
    }

    console.log(`Telemetry event ${eventId} successfully processed.`);

    return new Response(
      JSON.stringify({ success: true, message: "Onyx pipeline processing completed", eventId, verified: isVerified, severity, status, summary }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pipeline error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
});
