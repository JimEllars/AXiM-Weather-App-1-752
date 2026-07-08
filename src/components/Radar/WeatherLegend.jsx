import React from 'react';

const WeatherLegend = () => {
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
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reflectivity (dBZ)</p>
      <div className="flex gap-1">
        {levels.map((level) => (
          <div key={level.label} className="flex flex-col items-center gap-1">
            <div className={`w-8 h-2 rounded-sm ${level.color}`}></div>
            <span className="text-[8px] text-slate-500 font-bold">{level.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherLegend;