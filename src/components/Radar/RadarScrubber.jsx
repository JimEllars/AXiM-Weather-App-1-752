import React, { useState, useEffect } from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const RadarScrubber = ({ isPlaying, setIsPlaying }) => {
  const [progress, setProgress] = useState(0);
  const times = ['-60m', '-45m', '-30m', '-15m', 'LIVE'];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="glass-panel p-4 flex flex-col gap-3 w-full max-w-md">
      <div className="flex items-center justify-between px-1">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-axim-accent text-axim-dark flex items-center justify-center hover:scale-105 transition-transform"
        >
          <SafeIcon icon={isPlaying ? FiIcons.FiPause : FiIcons.FiPlay} className="ml-0.5" />
        </button>
        <div className="flex-1 px-4">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <div 
              className="absolute h-full bg-axim-accent shadow-[0_0_10px_#00E5FF]" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            {times.map((t, i) => (
              <span key={t} className={`text-[10px] font-mono ${i === times.length - 1 ? 'text-axim-accent' : 'text-slate-500'}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadarScrubber;