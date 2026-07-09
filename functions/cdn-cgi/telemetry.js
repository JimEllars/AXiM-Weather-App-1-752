export async function onRequestPost(context) {
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
       if(data.type === 'fps_drop' && data.payload?.fps) {
         stats.avgFps = ((stats.avgFps * stats.fpsSamples) + data.payload.fps) / (stats.fpsSamples + 1);
         stats.fpsSamples++;
       }
       if(data.type === 'websocket_connected' && data.payload?.latency) {
         stats.peakLatency = Math.max(stats.peakLatency, data.payload.latency);
       }
       if(data.type?.includes('error')) {
         stats.errorCount++;
       }
    });

    console.log("Telemetry Batched Stats:", JSON.stringify(stats, null, 2));

    return new Response(null, { status: 204 }); // 204 No Content
  } catch (err) {
    console.error("Telemetry parsing exception:", err);
    return new Response(null, { status: 204 }); // 204 No Content
  }
}
