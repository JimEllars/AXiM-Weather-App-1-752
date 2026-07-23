import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, Popup } from 'react-map-gl/maplibre';
import { supabase } from '../lib/supabase';
import { useAxim } from '../context/AximContext';
import { useNavigate, Link } from 'react-router-dom';
import MapControls from '../components/Map/MapControls';
import RadarScrubber from '../components/Radar/RadarScrubber';
import WeatherLegend from '../components/Radar/WeatherLegend';
import RadarOverlay from '../components/Radar/RadarOverlay';
import LocationSearch from '../components/Map/LocationSearch';
import LocalForecastPanel from '../components/Weather/LocalForecastPanel';
import { logTelemetry } from '../utils/telemetry';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MapPage = () => {
  const navigate = useNavigate();
  const mapRef = useRef();
  const { setActiveSpotters, isLive } = useAxim();
  // We keep points state only for initial load, but for high-frequency updates, we bypass React state.
  const [points, setPoints] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState({ radar: true, velocity: false, spotters: true, media: false });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const pointsRef = useRef({});
  // This state could represent the currently visible geohash based on map center/zoom
  const [activeGeohash, setActiveGeohash] = useState('9v6');
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, RECONNECTING, ERROR
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [mediaEvents, setMediaEvents] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);

  const debounceTimeout = useRef(null);

  const handleMoveEnd = useCallback(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (mapRef.current) {
        const center = mapRef.current.getCenter();
        const newGeohash = `9v${Math.abs(Math.floor(center.lat))}${Math.abs(Math.floor(center.lng))}`.substring(0, 6);
        if (newGeohash !== activeGeohash) {
          setActiveGeohash(newGeohash);
        }
      }
    }, 350);
  }, [activeGeohash]);


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

  // WebSocket Subscription with Exponential Backoff
  useEffect(() => {
    let isMounted = true;
    let retryAttempt = 0;
    const maxRetryDelay = 30000; // 30 seconds
    const baseDelay = 1000; // 1 second
    let channel;
    let reconnectTimeout;
    let uiCountdownInterval;

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

    const updatePointsState = () => {
      const geoJson = generateGeoJson();
      setPoints(geoJson.features);
      setActiveSpotters(geoJson.features.length);
    };

    const connectChannel = () => {
      setWsStatus(retryAttempt === 0 ? 'CONNECTING' : 'RECONNECTING');
      const channelName = `spatial:tracking:${activeGeohash}`;
      channel = supabase.channel(channelName);
      const startTime = Date.now();

      channel.on('broadcast', { event: 'location_update' }, (payload) => {
        const p = payload.payload;
        pointsRef.current[p.id] = p;

        const mapboxSource = mapRef.current?.getSource('spotters');
        if (mapboxSource) {
          const geoJson = generateGeoJson();
          mapboxSource.setData(geoJson);
          setActiveSpotters(geoJson.features.length);
        } else {
          updatePointsState();
        }
      }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          retryAttempt = 0; // reset on success
          setWsStatus('CONNECTED');
          const latency = Date.now() - startTime;
          logTelemetry('websocket_connected', { latency });
          console.log(`WebSocket connected in ${latency}ms`);

          // Hydrate
          try {
            if (!isMounted) return;
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
          setWsStatus('ERROR');

          // Exponential backoff
          const jitter = Math.random() * 500;
          let delay = Math.min(maxRetryDelay, baseDelay * Math.pow(2, retryAttempt)) + jitter;

          let secondsRemaining = Math.ceil(delay / 1000);
          setRetrySeconds(secondsRemaining);

          uiCountdownInterval = setInterval(() => {
            secondsRemaining -= 1;
            if(secondsRemaining > 0) {
              setRetrySeconds(secondsRemaining);
            } else {
              clearInterval(uiCountdownInterval);
            }
          }, 1000);

          reconnectTimeout = setTimeout(() => {
            retryAttempt++;
            supabase.removeChannel(channel);
            connectChannel();
          }, delay);
        }
      });
    };

    connectChannel();

    return () => {
      clearTimeout(reconnectTimeout);
      isMounted = false;
      clearInterval(uiCountdownInterval);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [setActiveSpotters, activeGeohash]);

  useEffect(() => {
    if (layers.media) {
      const fetchMediaEvents = async () => {
        const { data, error } = await supabase
          .from('telemetry_events')
          .select('*')
          .not('media_url', 'is', null);

        if (!error && data) {
          setMediaEvents(data);
        }
      };
      fetchMediaEvents();
    } else {
      setMediaEvents([]);
    }
  }, [layers.media]);

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

  const onClick = useCallback((event) => {
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
  }, []);

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

      {/* Network Status Indicator */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full shadow-lg self-end">
          <div className={`w-2 h-2 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-green-500 animate-pulse' : wsStatus === 'CONNECTING' ? 'bg-yellow-500 animate-pulse' : wsStatus === 'RECONNECTING' || wsStatus === 'ERROR' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-mono font-medium text-slate-300">
            {wsStatus === 'CONNECTED' && 'LIVE'}
            {wsStatus === 'CONNECTING' && 'CONNECTING...'}
            {(wsStatus === 'RECONNECTING' || wsStatus === 'ERROR') && `RETRY IN ${retrySeconds}s`}
          </span>
        </div>

        {isLive && (
          <Link to="/stream" className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full shadow-lg border border-red-500/50 hover:bg-red-500/10 transition-colors group self-end">
             <div className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute"></div>
             <div className="w-2 h-2 rounded-full bg-red-500 relative"></div>
             <span className="text-xs font-bold text-red-400 group-hover:text-red-300">STUDIO LIVE</span>
          </Link>
        )}
      </div>

      <Map
        ref={mapRef}
        initialViewState={{ longitude: -96.797, latitude: 32.776, zoom: 4 }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        onClick={onClick}
        onMoveEnd={handleMoveEnd}
      >
        <NavigationControl position="bottom-right" />
        
        <RadarOverlay isVisible={layers.radar && !layers.media} opacity={isPlaying ? 0.8 : 0.5} />

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

        {layers.media && mediaEvents.map(event => (
          <MemoizedMarker
            key={event.id}
            event={event}
            onSelect={setSelectedMedia}
          />
        ))}

        {selectedMedia && (
          <Popup
            longitude={selectedMedia.lng || 0}
            latitude={selectedMedia.lat || 0}
            anchor="top"
            onClose={() => setSelectedMedia(null)}
            className="z-50"
          >
            <div className="bg-axim-dark p-3 rounded-lg border border-slate-700 max-w-[250px] shadow-2xl">
              {selectedMedia.media_url && <img src={selectedMedia.media_url} className="w-full rounded mb-2 object-cover max-h-48" alt="Spotter Media" />}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-bold">{selectedMedia.type || 'Media Update'}</p>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider">Verified Upload</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={async () => {
                      const newCount = (selectedMedia.verification_count || 0) + 1;
                      // Optimistic UI update
                      setSelectedMedia({ ...selectedMedia, verification_count: newCount });
                      setMediaEvents(prev => prev.map(m => m.id === selectedMedia.id ? { ...m, verification_count: newCount } : m));

                      const { error } = await supabase
                        .from('telemetry_events')
                        .update({ verification_count: newCount })
                        .eq('id', selectedMedia.id);

                      if (error) {
                        console.error('Error updating verification count:', error);
                        // Revert optimistic update
                        setSelectedMedia({ ...selectedMedia, verification_count: newCount - 1 });
                        setMediaEvents(prev => prev.map(m => m.id === selectedMedia.id ? { ...m, verification_count: newCount - 1 } : m));
                      }
                    }}
                    className="flex items-center justify-center p-1.5 rounded-md bg-slate-800 hover:bg-green-500/20 text-slate-400 hover:text-green-400 transition-colors border border-slate-700 hover:border-green-500/50 group" title="Helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    {selectedMedia.verification_count > 0 && <span className="ml-1 text-xs">{selectedMedia.verification_count}</span>}
                  </button>
                  <button
                    onClick={async () => {
                      const newCount = (selectedMedia.verification_count || 0) + 1;
                      // Optimistic UI update
                      setSelectedMedia({ ...selectedMedia, verification_count: newCount });
                      setMediaEvents(prev => prev.map(m => m.id === selectedMedia.id ? { ...m, verification_count: newCount } : m));

                      const { error } = await supabase
                        .from('telemetry_events')
                        .update({ verification_count: newCount })
                        .eq('id', selectedMedia.id);

                      if (error) {
                        console.error('Error updating verification count:', error);
                        // Revert optimistic update
                        setSelectedMedia({ ...selectedMedia, verification_count: newCount - 1 });
                        setMediaEvents(prev => prev.map(m => m.id === selectedMedia.id ? { ...m, verification_count: newCount - 1 } : m));
                      }
                    }}
                    className="flex items-center justify-center p-1.5 rounded-md bg-slate-800 hover:bg-axim-accent/20 text-slate-400 hover:text-axim-accent transition-colors border border-slate-700 hover:border-axim-accent/50 group" title="Verify"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {selectedMedia.verification_count > 0 && <span className="ml-1 text-xs">{selectedMedia.verification_count}</span>}
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <MapControls layers={layers} setLayers={setLayers} activeSpotters={points.length} />
      
      <LocalForecastPanel locationName={selectedLocation} />
      <div className="md:hidden absolute bottom-32 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm pointer-events-auto">
        <button
          onClick={() => {
             // Navigating to submit form while keeping coordinates if available
             navigate("/submit?lat=" + mapRef.current.getCenter().lat + "&lng=" + mapRef.current.getCenter().lng);
          }}
          className="w-full py-3 px-6 glass-panel bg-axim-accent/20 hover:bg-axim-accent/40 border border-axim-accent/50 text-white font-bold rounded-full shadow-lg backdrop-blur-md transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Tag Local Weather
        </button>
      </div>

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
