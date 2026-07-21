import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Validate the request signature/token
  const authHeader = request.headers.get('Authorization');
  const secretToken = env.STREAMLABS_SECRET_TOKEN;

  // Simple bearer token validation
  if (!authHeader || authHeader !== \`Bearer \${secretToken}\`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();

    // Streamlabs specific logic - e.g. checking if status is live
    // This assumes body contains { is_live: boolean, stream_url: string } for simplicity
    const { is_live, stream_url } = body;

    if (typeof is_live !== 'boolean' || typeof stream_url !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const supabaseUrl = env.VITE_SUPABASE_URL || 'https://pvbcdndqjguzqeafhwhw.supabase.co';
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend updates

    if (!supabaseKey) {
       console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
       return new Response(JSON.stringify({ error: 'Server configuration error' }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('app_settings')
      .update({ is_live, stream_url, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      console.error('Supabase update error:', error);
      return new Response(JSON.stringify({ error: 'Failed to update status' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, is_live, stream_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
