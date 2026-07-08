import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const MapControls = ({ layers, setLayers, activeSpotters }) => {
  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-4 z-10">
      {/* Status Panel */}
      <div className="glass-panel p-4 flex flex-col gap-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Network Status</h3>
        <div className="flex items-center gap-2 text-axim-accent">
          <div className="w-2 h-2 rounded-full bg-axim-accent animate-pulse"></div>
          <span className="font-mono font-bold text-lg">{activeSpotters.toLocaleString()}</span>
          <span className="text-sm text-slate-300">Active Spotters</span>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="glass-panel p-2 flex flex-col gap-2">
        <LayerButton 
          active={layers.radar} 
          onClick={() => toggleLayer('radar')}
          icon={FiIcons.FiCloudRain}
          label="NEXRAD Reflectivity"
        />
        <LayerButton 
          active={layers.velocity} 
          onClick={() => toggleLayer('velocity')}
          icon={FiIcons.FiWind}
          label="Wind Velocity"
        />
        <LayerButton 
          active={layers.spotters} 
          onClick={() => toggleLayer('spotters')}
          icon={FiIcons.FiUsers}
          label="Spotter Network"
        />
      </div>
    </div>
  );
};

const LayerButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm font-medium
      ${active ? 'bg-axim-accent/20 text-axim-accent' : 'hover:bg-slate-800 text-slate-400'}
    `}
  >
    <SafeIcon icon={icon} className="text-lg" />
    <span>{label}</span>
  </button>
);

export default MapControls;