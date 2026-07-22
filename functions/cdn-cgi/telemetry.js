import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const startTime = Date.now();
  try {
    const rawBody = await context.request.text();
    if (!rawBody) {
      return new Response(null, { status: 204 });
    }

    let payloads;
    try {
      payloads = JSON.parse(rawBody);
    } catch (e) {
      return new Response(null, { status: 204 });
    }

    if (payloads.events) {
       payloads = payloads.events;
    }

    // Handle single payload or batched array
    if (!Array.isArray(payloads)) {
      payloads = [payloads];
    }

    let stats = {
      avgFps: 0,
      peakLatency: 0,
      errorCount: 0,
      fpsSamples: 0
    };

    payloads.forEach(data => {
       if(data.eventType === 'fps_drop' && data.data?.fps) {
         stats.avgFps = ((stats.avgFps * stats.fpsSamples) + data.data.fps) / (stats.fpsSamples + 1);
         stats.fpsSamples++;
       }
       if(data.eventType === 'websocket_connected' && data.data?.latency) {
         stats.peakLatency = Math.max(stats.peakLatency, data.data.latency);
       }
       if(data.eventType?.includes('error')) {
         stats.errorCount++;
       }
    });

    console.log("Telemetry Batched Stats:", JSON.stringify(stats, null, 2));

    const executionDuration = Date.now() - startTime;
    const cfIpCountry = context.request.headers.get('CF-IPCountry') || 'UNKNOWN';
    const cfRay = context.request.headers.get('CF-Ray') || 'UNKNOWN';
    const cacheStatus = context.request.headers.get('cf-cache-status') || 'MISS';

    const supabaseUrl = context.env.VITE_SUPABASE_URL || 'https://pvbcdndqjguzqeafhwhw.supabase.co';
    const supabaseKey = context.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
       const supabase = createClient(supabaseUrl, supabaseKey);

       const telemetryPayload = {
         type: 'edge_telemetry',
         execution_duration_ms: executionDuration,
         cf_ip_country: cfIpCountry,
         cf_ray: cfRay,
         cache_status: cacheStatus,
         events_count: payloads.length,
         ...stats
       };

       const { error } = await supabase
        .from('telemetry_events')
        .insert([{
            type: 'system_metric',
            severity: 'INFO',
            verified: true,
            status: 'logged',
            media_url: JSON.stringify(telemetryPayload)
        }]);

       if (error) {
           console.error("Error logging to AXiM Core telemetry table:", error);
       }
    }

    return new Response(null, { status: 204 }); // 204 No Content
  } catch (err) {
    console.error("Telemetry parsing exception:", err);
    return new Response(null, { status: 204 }); // 204 No Content
  }
}
