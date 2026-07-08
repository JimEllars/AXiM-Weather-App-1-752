import React, { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import useSupercluster from 'use-supercluster';
import { supabase } from '../lib/supabase';
import { useAxim } from '../context/AximContext';
import MapControls from '../components/Map/MapControls';
import ClusterMarker from '../components/Map/ClusterMarker';
import SpotterMarker from '../components/Map/SpotterMarker';
import RadarScrubber from '../components/Radar/RadarScrubber';
import WeatherLegend from '../components/Radar/WeatherLegend';
import RadarOverlay from '../components/Radar/RadarOverlay';
import { logTelemetry } from '../utils/telemetry';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MapPage = () => {
  const mapRef = useRef();
  const { setActiveSpotters } = useAxim();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(4);
  const [points, setPoints] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState({ radar: true, velocity: false, spotters: true });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const pointsRef = useRef({});

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
    const channel = supabase.channel('spatial:tracking');
    const startTime = Date.now();

    channel.on('broadcast', { event: 'location_update' }, (payload) => {
      const p = payload.payload;
      pointsRef.current[p.id] = p;

      const newPoints = Object.values(pointsRef.current).map(spotter => ({
        type: 'Feature',
        properties: {
          cluster: false,
          spotterId: spotter.id,
          status: spotter.status || 'active',
          heading: spotter.heading || 0,
        },
        geometry: {
          type: 'Point',
          coordinates: [spotter.lng, spotter.lat]
        }
      }));
      setPoints(newPoints);
      setActiveSpotters(newPoints.length);
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logTelemetry('websocket_connected', { latency: Date.now() - startTime });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        logTelemetry('websocket_error', { status });
      }
    });

    // Mock initial data if no broadcast is sent yet (to show something)
    const initialPoints = Array.from({ length: 50 }).map((_, i) => ({
      id: `spotter-init-${i}`,
      lng: -96.797 + (Math.random() - 0.5) * 10,
      lat: 32.776 + (Math.random() - 0.5) * 10,
      status: Math.random() > 0.9 ? 'live' : 'active',
      heading: Math.random() * 360
    }));

    initialPoints.forEach(p => { pointsRef.current[p.id] = p; });
    const newPoints = initialPoints.map(spotter => ({
        type: 'Feature',
        properties: {
          cluster: false,
          spotterId: spotter.id,
          status: spotter.status,
          heading: spotter.heading,
        },
        geometry: {
          type: 'Point',
          coordinates: [spotter.lng, spotter.lat]
        }
    }));
    setPoints(newPoints);
    setActiveSpotters(newPoints.length);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setActiveSpotters]);

  const { clusters, supercluster } = useSupercluster({
    points: layers.spotters ? points : [],
    bounds, zoom, options: { radius: 75, maxZoom: 20 }
  });

  const handleMapChange = useCallback(() => {
    if (mapRef.current) {
      const b = mapRef.current.getMap().getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      setZoom(mapRef.current.getMap().getZoom());
    }
  }, []);

  return (
    <div className="w-full h-full relative bg-axim-dark">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -96.797, latitude: 32.776, zoom: 5 }}
        mapStyle={MAP_STYLE}
        onMove={handleMapChange}
        onLoad={handleMapChange}
      >
        <NavigationControl position="bottom-right" />
        
        <RadarOverlay isVisible={layers.radar} opacity={isPlaying ? 0.8 : 0.5} />

        {clusters.map(cluster => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: count } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={`c-${cluster.id}`} latitude={lat} longitude={lng} style={{ transition: 'all 0.3s ease-out' }}>
                <ClusterMarker count={count} totalPoints={points.length} onClick={() => {
                  const z = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                  mapRef.current?.getMap().flyTo({ center: [lng, lat], zoom: z, speed: 1.5 });
                }} />
              </Marker>
            );
          }

          return (
            <Marker key={cluster.properties.spotterId} latitude={lat} longitude={lng} style={{ transition: 'all 0.3s ease-out' }}>
              <SpotterMarker status={cluster.properties.status} heading={cluster.properties.heading} />
            </Marker>
          );
        })}
      </Map>

      <MapControls layers={layers} setLayers={setLayers} activeSpotters={points.length} />
      
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
