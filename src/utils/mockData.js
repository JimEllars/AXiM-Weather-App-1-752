// Generates random spotter points across the US
export const generateMockSpotters = (count = 5000) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    // US Bounds rough approximation
    const lng = -125 + Math.random() * 58; 
    const lat = 24 + Math.random() * 25;   
    
    // Randomize status
    const statuses = ['active', 'idle', 'live'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    points.push({
      type: 'Feature',
      properties: {
        cluster: false,
        spotterId: `spotter-${i}`,
        status,
        heading: Math.floor(Math.random() * 360),
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    });
  }
  return points;
};