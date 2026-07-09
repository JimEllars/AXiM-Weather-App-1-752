import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const MapControls = ({ layers, setLayers, activeSpotters }) => {
  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="absolute top-4 left-4 flex flex-col gap-4 z-10 max-w-[200px] md:max-w-xs">
      {/* Status Panel */}
      <div className="glass-panel p-3 md:p-4 flex flex-col gap-1">
        <h3 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Network Status</h3>
        <div className="flex items-center gap-2 text-axim-accent">
          <div className="w-2 h-2 rounded-full bg-axim-accent animate-pulse"></div>
          <span className="font-mono font-bold text-base md:text-lg">{activeSpotters.toLocaleString()}</span>
          <span className="text-xs md:text-sm text-slate-300 hidden md:inline">Active Spotters</span>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="glass-panel p-2 flex flex-col gap-2">
        <LayerButton 
          active={layers.radar} 
          onClick={() => toggleLayer('radar')}
          icon={FiIcons.FiCloudRain}
          label="Reflectivity"
        />
        <LayerButton 
          active={layers.velocity} 
          onClick={() => toggleLayer('velocity')}
          icon={FiIcons.FiWind}
          label="Wind"
        />
        <LayerButton 
          active={layers.spotters} 
          onClick={() => toggleLayer('spotters')}
          icon={FiIcons.FiUsers}
          label="Spotters"
        />
      </div>
    </div>
  );
};

const LayerButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-lg transition-all text-xs md:text-sm font-medium
      ${active ? 'bg-axim-accent/20 text-axim-accent' : 'hover:bg-slate-800 text-slate-400'}
    `}
  >
    <SafeIcon icon={icon} className="text-base md:text-lg" />
    <span className="hidden md:inline">{label}</span>
  </button>
);

export default MapControls;
