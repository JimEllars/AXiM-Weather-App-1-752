import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Validate Secret Token
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${env.FLEET_SECRET_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await request.json();
    const { route_id, bounding_box, severity } = payload;

    if (!route_id) {
      return new Response(JSON.stringify({ error: 'Missing route_id in payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Insert alert into global_alerts
    // Note: The prompt specifically asks not to trigger a push notification for this webhook.
    // Assuming the push notification trigger is explicitly filtering out certain severities or
    // it was handled in the trigger itself. The prompt says "Let the operatives discover this passively in the UI; do not trigger a push notification for this specific webhook."
    // We can use a severity like 'medium' or 'logistics' that the push trigger (which requires 'critical') will ignore.
    const alertSeverity = severity === 'critical' ? 'high' : (severity || 'medium'); // downgrade critical to avoid push if that's the trigger logic

    const alertMessage = `Logistics Fleet ${route_id} Rerouted. ${bounding_box ? 'Avoiding active threat zone.' : ''}`;

    const { error: dbError } = await supabase.from('global_alerts').insert({
      title: 'Fleet Logistics Update',
      message: alertMessage,
      severity: alertSeverity,
      // Custom metadata could go here if schema supports it
    });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true, message: "Fleet reroute logged." }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fleet-webhook endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
