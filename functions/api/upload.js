export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Generate a unique filename to prevent collisions
    const ext = file.name ? file.name.split('.').pop() : 'bin';
    const filename = `${crypto.randomUUID()}.${ext}`;

    // Push the file into AXiM R2 bucket
    await env.AXIM_R2_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    // Return the public R2 URL
    const publicR2Domain = env.PUBLIC_R2_URL || 'https://axim-r2.example.com';
    const mediaUrl = `${publicR2Domain}/${filename}`;

    return new Response(JSON.stringify({ mediaUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
  }
}
