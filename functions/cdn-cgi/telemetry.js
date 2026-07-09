export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    console.log("Telemetry Payload received:", JSON.stringify(data, null, 2));

    // Cloudflare pages functions / workers log to the dashboard, so console.log is the expected way
    // to pipe to the CF dashboard.

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Failed to parse telemetry data", err);
    return new Response("Bad Request", { status: 400 });
  }
}
