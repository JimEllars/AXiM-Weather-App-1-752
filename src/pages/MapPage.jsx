import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import useSupercluster from 'use-supercluster';
import { generateMockSpotters } from '../utils/mockData';
import { useAxim } from '../context/AximContext';
import MapControls from '../components/Map/MapControls';
import ClusterMarker from '../components/Map/ClusterMarker';
import SpotterMarker from '../components/Map/SpotterMarker';
import RadarScrubber from '../components/Radar/RadarScrubber';
import WeatherLegend from '../components/Radar/WeatherLegend';
import RadarOverlay from '../components/Radar/RadarOverlay';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const MapPage = () => {
  const mapRef = useRef();
  const { activeSpotters } = useAxim();
  const [bounds, setBounds] = useState(null);
  const [zoom, setZoom] = useState(4);
  const [points, setPoints] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [layers, setLayers] = useState({ radar: true, velocity: false, spotters: true });

  useEffect(() => {
    setPoints(generateMockSpotters(activeSpotters));
  }, [activeSpotters]);

  const { clusters, supercluster } = useSupercluster({
    points: layers.spotters ? points : [],
    bounds, zoom, options: { radius: 75, maxZoom: 20 }
  });

  const handleMapChange = () => {
    if (mapRef.current) {
      const b = mapRef.current.getMap().getBounds();
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      setZoom(mapRef.current.getMap().getZoom());
    }
  };

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
        
        {/* Mock Radar Layer */}
        <RadarOverlay isVisible={layers.radar} opacity={isPlaying ? 0.8 : 0.5} />

        {clusters.map(cluster => {
          const [lng, lat] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: count } = cluster.properties;
          if (isCluster) return (
            <Marker key={`c-${cluster.id}`} latitude={lat} longitude={lng}>
              <ClusterMarker count={count} totalPoints={points.length} onClick={() => {
                const z = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 20);
                mapRef.current?.getMap().flyTo({ center: [lng, lat], zoom: z, speed: 1.5 });
              }} />
            </Marker>
          );
          return (
            <Marker key={cluster.properties.spotterId} latitude={lat} longitude={lng}>
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