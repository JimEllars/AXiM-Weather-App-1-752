import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const FORECAST_DATA = [
  { day: 'Mon', icon: FiIcons.FiSun, tempHigh: 85, tempLow: 68 },
  { day: 'Tue', icon: FiIcons.FiCloudRain, tempHigh: 82, tempLow: 65, alert: true },
  { day: 'Wed', icon: FiIcons.FiCloudLightning, tempHigh: 78, tempLow: 62, alert: true },
  { day: 'Thu', icon: FiIcons.FiCloud, tempHigh: 74, tempLow: 60 },
  { day: 'Fri', icon: FiIcons.FiSun, tempHigh: 79, tempLow: 61 },
];

const LocalForecastPanel = ({ locationName }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20 pointer-events-none"
        >
          <div className="glass-panel p-4 pointer-events-auto shadow-2xl relative">
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
            >
              <SafeIcon icon={FiIcons.FiX} className="text-lg" />
            </button>

            <div className="mb-3 flex items-center justify-between pr-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <SafeIcon icon={FiIcons.FiMapPin} className="text-axim-accent" />
                {locationName || 'Current Location'}
              </h3>
              <span className="text-xs font-semibold px-2 py-1 bg-axim-success/20 text-axim-success rounded-md uppercase tracking-wide">
                Live Data
              </span>
            </div>

            <div className="flex justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
              {FORECAST_DATA.map((day, idx) => (
                <div key={idx} className={`flex-1 min-w-[70px] flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${day.alert ? 'bg-axim-danger/10 border border-axim-danger/30' : 'bg-slate-800/30'}`}>
                  <span className="text-xs text-slate-400 font-medium uppercase mb-1">{day.day}</span>
                  <SafeIcon icon={day.icon} className={`text-2xl mb-2 ${day.alert ? 'text-axim-danger' : 'text-slate-300'}`} />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-bold">{day.tempHigh}°</span>
                    <span className="text-slate-500">{day.tempLow}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocalForecastPanel;
