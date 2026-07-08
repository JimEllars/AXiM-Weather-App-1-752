import React from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

const RadarOverlay = ({ isVisible, opacity = 0.6 }) => {
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
        properties: { intensity: 45 }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-97, 34], [-94, 34], [-94, 32], [-97, 32], [-97, 34]
          ]]
        },
        properties: { intensity: 65 } // Severe core
      }
    ]
  };

  return (
    <Source id="radar-source" type="geojson" data={radarData}>
      <Layer
        id="radar-layer"
        type="fill"
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