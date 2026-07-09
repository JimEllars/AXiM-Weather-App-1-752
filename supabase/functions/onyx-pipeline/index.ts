import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received payload from media_staging bucket:", payload);

    // Mock verification step: Read metadata, "strip" EXIF, log telemetry
    const fileName = payload.record?.name || "unknown";

    console.log(`Processing file: ${fileName}`);
    console.log("Stripping EXIF data...");

    const telemetryEvent = {
      eventType: "onyx_analysis_ready",
      data: {
        fileName,
        timestamp: Date.now(),
        status: "Ready for Onyx Analysis"
      }
    };

    console.log("Telemetry Event:", telemetryEvent);

    return new Response(
      JSON.stringify({ success: true, message: "Onyx pipeline scaffold triggered", telemetry: telemetryEvent }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
