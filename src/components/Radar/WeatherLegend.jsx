import React from 'react';
import { useRadarFilters } from './radarState';

const WeatherLegend = () => {
  const { hiddenLevels, toggleLevel } = useRadarFilters();

  const levels = [
    { color: 'bg-green-500', label: 'Light' },
    { color: 'bg-yellow-400', label: 'Mod' },
    { color: 'bg-orange-500', label: 'Heavy' },
    { color: 'bg-red-600', label: 'Severe' },
    { color: 'bg-purple-600', label: 'Hail' },
    { color: 'bg-pink-500', label: 'TVS' },
  ];

  return (
    <div className="glass-panel p-3 flex flex-col gap-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reflectivity (dBZ) Filters</p>
      <div className="flex gap-1">
        {levels.map((level) => {
          const isHidden = hiddenLevels.has(level.label);
          return (
            <div
              key={level.label}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-opacity duration-200 ${isHidden ? 'opacity-30' : 'opacity-100 hover:opacity-80'}`}
              onClick={() => toggleLevel(level.label)}
            >
              <div className={`w-8 h-2 rounded-sm ${level.color}`}></div>
              <span className="text-[8px] text-slate-500 font-bold">{level.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeatherLegend;
