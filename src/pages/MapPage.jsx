import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import { supabase } from '../lib/supabase';
import { useAxim } from '../context/AximContext';
import MapControls from '../components/Map/MapControls';
import RadarScrubber from '../components/Radar/RadarScrubber';
import WeatherLegend from '../components/Radar/WeatherLegend';
import RadarOverlay from '../components/Radar/RadarOverlay';
import LocationSearch from '../components/Map/LocationSearch';
import LocalForecastPanel from '../components/Weather/LocalForecastPanel';
import { logTelemetry } from '../utils/telemetry';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MapPage = () => {
  const mapRef = useRef();
  const { setActiveSpotters } = useAxim();
  // We keep points state only for initial load, but for high-frequency updates, we bypass React state.
  const [points, setPoints] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState({ radar: true, velocity: false, spotters: true });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const pointsRef = useRef({});
  // This state could represent the currently visible geohash based on map center/zoom
  const [activeGeohash, setActiveGeohash] = useState('9v6');

  // FPS Tracking for map rendering
  useEffect(() => {
    let animationFrameId;

    const trackFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const fps = (frameCountRef.current * 1000) / delta;
        if (fps < 50) {
          logTelemetry('fps_drop', { fps, pointCount: Object.keys(pointsRef.current).length });
        }
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animationFrameId = requestAnimationFrame(trackFps);
    };

    animationFrameId = requestAnimationFrame(trackFps);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // WebSocket Subscription
  useEffect(() => {
    // Incorporate geohash into channel for more granular updates if backend supports it
    // Or just use the active geohash for the REST hydration filter.
    const channelName = `spatial:tracking:${activeGeohash}`;
    const channel = supabase.channel(channelName);
    const startTime = Date.now();

    const generateGeoJson = () => {
      const features = Object.values(pointsRef.current).map(spotter => ({
        type: 'Feature',
        properties: {
          spotterId: spotter.id,
          status: spotter.status || 'active',
          heading: spotter.heading || 0,
        },
        geometry: {
          type: 'Point',
          coordinates: [spotter.lng, spotter.lat]
        }
      }));

      return {
        type: 'FeatureCollection',
        features
      };
    };

    // Fallback update for React state in case the map isn't loaded yet.
    const updatePointsState = () => {
      const geoJson = generateGeoJson();
      setPoints(geoJson.features);
      setActiveSpotters(geoJson.features.length);
    };

    channel.on('broadcast', { event: 'location_update' }, (payload) => {
      const p = payload.payload;
      pointsRef.current[p.id] = p;

      const mapboxSource = mapRef.current?.getSource('spotters');
      if (mapboxSource) {
        // Direct MapLibre Source update, bypass React render cycle
        const geoJson = generateGeoJson();
        mapboxSource.setData(geoJson);
        setActiveSpotters(geoJson.features.length);
      } else {
        updatePointsState();
      }
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const latency = Date.now() - startTime;
        logTelemetry('websocket_connected', { latency });
        console.log(`WebSocket connected in ${latency}ms`);

        // Hydrate active spotters for current geohash via REST
        try {
          // Clear current points before hydrating new region
          pointsRef.current = {};

          const { data, error } = await supabase
            .from('active_spotters')
            .select('*')
            .eq('geohash', activeGeohash);

          if (error) throw error;

          if (data && data.length > 0) {
            data.forEach(p => { pointsRef.current[p.id] = p; });
            const mapboxSource = mapRef.current?.getSource('spotters');
            if (mapboxSource) {
              const geoJson = generateGeoJson();
              mapboxSource.setData(geoJson);
              setActiveSpotters(geoJson.features.length);
            } else {
              updatePointsState();
            }
          } else {
            // Even if no data, ensure we clear the old data from the map
            const mapboxSource = mapRef.current?.getSource('spotters');
            if (mapboxSource) {
              mapboxSource.setData(generateGeoJson());
              setActiveSpotters(0);
            } else {
              updatePointsState();
            }
          }
        } catch (err) {
          console.error("Failed to hydrate spotters:", err);
          logTelemetry('hydration_error', { error: err.message });
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        logTelemetry('websocket_error', { status });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setActiveSpotters, activeGeohash]);

  const geoJsonData = useMemo(() => ({
    type: 'FeatureCollection',
    features: points
  }), [points]);

  const clusterLayer = {
    id: 'clusters',
    type: 'circle',
    source: 'spotters',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': ['step', ['get', 'point_count'], '#00e5ff', 100, '#00b3cc', 750, '#008099'],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  };

  const clusterCountLayer = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'spotters',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12
    },
    paint: {
      'text-color': '#ffffff'
    }
  };

  const unclusteredPointLayer = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'spotters',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'status'],
        'live', '#ff3d71',
        '#00e5ff' // default to active
      ],
      'circle-radius': 8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff'
    }
  };

  const onClick = (event) => {
    const feature = event.features[0];
    if (!feature) return;

    if (feature.layer.id === 'clusters') {
      const clusterId = feature.properties.cluster_id;
      const mapboxSource = mapRef.current.getSource('spotters');

      mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        mapRef.current.easeTo({
          center: feature.geometry.coordinates,
          zoom: zoom,
          duration: 500
        });
      });
    }
  };

  const handleLocationSelect = (loc) => {
    setSelectedLocation(loc.name);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [loc.lng, loc.lat],
        zoom: 10,
        essential: true,
        duration: 2000
      });
    }
    // Dummy update geohash for demonstration
    setActiveGeohash('9v' + Math.floor(Math.random() * 10));
  };

  return (
    <div className="w-full h-full relative bg-axim-dark">
      <LocationSearch onLocationSelect={handleLocationSelect} />

      <Map
        ref={mapRef}
        initialViewState={{ longitude: -96.797, latitude: 32.776, zoom: 4 }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        onClick={onClick}
      >
        <NavigationControl position="bottom-right" />
        
        <RadarOverlay isVisible={layers.radar} opacity={isPlaying ? 0.8 : 0.5} />

        {layers.spotters && (
          <Source
            id="spotters"
            type="geojson"
            data={geoJsonData}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer {...clusterLayer} />
            <Layer {...clusterCountLayer} />
            <Layer {...unclusteredPointLayer} />
          </Source>
        )}
      </Map>

      <MapControls layers={layers} setLayers={setLayers} activeSpotters={points.length} />
      
      <LocalForecastPanel locationName={selectedLocation} />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full px-4 flex flex-col items-center gap-4 z-10 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center gap-2 w-full max-w-lg">
          <WeatherLegend />
          <RadarScrubber isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
