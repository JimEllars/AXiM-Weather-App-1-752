import webpush from 'web-push';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Validate Secret Token
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${env.PUSH_SECRET_TOKEN}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const payload = await request.json();
    const { subscriptions, message } = payload;

    if (!subscriptions || !Array.isArray(subscriptions)) {
      return new Response(JSON.stringify({ error: 'Invalid subscriptions payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Configure Web Push with VAPID keys
    webpush.setVapidDetails(
      'mailto:admin@axim-weather.local',
      env.VITE_VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );

    const notificationPayload = JSON.stringify({
      title: 'AXiM Core Alert',
      body: message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    });

    const sendPromises = subscriptions.map(sub => {
      // Basic check to ensure sub is in correct format
      if (!sub.endpoint) return Promise.resolve(null);

      return webpush.sendNotification(sub, notificationPayload).catch(error => {
        console.error('Push notification failed for a subscription:', error);
        return null;
      });
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, count: subscriptions.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-push endpoint:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
