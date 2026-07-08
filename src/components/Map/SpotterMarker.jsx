import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const SpotterMarker = ({ status, heading }) => {
  const getStatusColor = () => {
    switch(status) {
      case 'live': return 'text-axim-danger border-axim-danger shadow-[0_0_10px_rgba(255,61,113,0.5)]';
      case 'active': return 'text-axim-accent border-axim-accent shadow-[0_0_10px_rgba(0,229,255,0.3)]';
      default: return 'text-slate-400 border-slate-600';
    }
  };

  return (
    <div className="relative group cursor-pointer">
      {status === 'live' && (
        <div className="absolute -inset-2 bg-axim-danger/30 rounded-full animate-pulse-fast"></div>
      )}
      <div className={`
        w-8 h-8 bg-axim-panel rounded-full border-2 flex items-center justify-center
        transition-all shadow-lg ${getStatusColor()}
      `}>
        <SafeIcon 
          icon={status === 'live' ? FiIcons.FiVideo : FiIcons.FiNavigation} 
          className="text-sm"
          style={{ transform: status !== 'live' ? `rotate(${heading}deg)` : 'none' }}
        />
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap">
        <div className="glass-panel px-3 py-1 text-xs">
          {status === 'live' ? 'Live Broadcast' : 'Spotter Active'}
        </div>
      </div>
    </div>
  );
};

export default SpotterMarker;