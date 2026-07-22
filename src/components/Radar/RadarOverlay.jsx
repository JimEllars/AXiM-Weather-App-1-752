import React, { useEffect, useState } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useRadarFilters } from './radarState';

const RadarOverlay = ({ isVisible, opacity = 0.6 }) => {
  const [frames, setFrames] = useState([]);
  const { hiddenLevels } = useRadarFilters();

  // Preload images in the background
  useEffect(() => {
    const fetchRadar = async () => {
      try {
        // We simulate calling the edge API endpoint
        const response = await fetch('/api/weather');
        if (response.ok) {
          const data = await response.json();
          setFrames(data.frames);

          // Background Image Preloader pool
          data.frames.slice(0, 3).forEach(frame => {
             const img = new Image();
             img.src = frame.url;
          });
        }
      } catch (err) {
        console.error("Failed to fetch radar frames:", err);
      }
    };

    // Call only if visible
    if(isVisible) {
      fetchRadar();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  // Mock radar data using a large circular area with "blobs"
  // In a real app, this would be a TileJSON or GeoJSON feed from NOAA/Mapbox
  const radarData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-100, 35], [-95, 37], [-90, 35], [-92, 32], [-98, 31], [-100, 35]
          ]]
        },
        properties: { intensity: 45, label: 'Mod' }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-97, 34], [-94, 34], [-94, 32], [-97, 32], [-97, 34]
          ]]
        },
        properties: { intensity: 65, label: 'Severe' } // Severe core
      }
    ]
  };

  const allLabels = ['Light', 'Mod', 'Heavy', 'Severe', 'Hail', 'TVS'];
  const allowedLabels = allLabels.filter(l => !hiddenLevels.has(l));

  // Create filter expression
  // if all hidden, ['in', ['get', 'label'], ['literal', []]]
  const filterExpression = ['in', ['get', 'label'], ['literal', allowedLabels]];

  return (
    <Source id="radar-source" type="geojson" data={radarData}>
      <Layer
        id="radar-layer"
        type="fill"
        filter={filterExpression}
        paint={{
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            40, '#22c55e',
            50, '#eab308',
            60, '#ef4444',
            70, '#a855f7'
          ],
          'fill-opacity': opacity,
          'fill-outline-color': 'transparent'
        }}
      />
    </Source>
  );
};

export default RadarOverlay;
