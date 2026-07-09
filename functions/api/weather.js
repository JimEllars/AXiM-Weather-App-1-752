export async function onRequestGet(context) {
  // Mock radar frames for demonstration
  // In a real app this would proxy Mapbox or NOAA
  const radarFrames = [
    { time: '-60m', url: '/radar-frame-60.png' },
    { time: '-45m', url: '/radar-frame-45.png' },
    { time: '-30m', url: '/radar-frame-30.png' },
    { time: '-15m', url: '/radar-frame-15.png' },
    { time: 'LIVE', url: '/radar-frame-live.png' }
  ];

  const response = new Response(JSON.stringify({ frames: radarFrames }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300, s-maxage=300'
    }
  });

  return response;
}
