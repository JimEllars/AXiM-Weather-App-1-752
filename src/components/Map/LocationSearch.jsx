import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const MOCK_LOCATIONS = [
  { name: 'Dallas, TX', lat: 32.776, lng: -96.797 },
  { name: 'Oklahoma City, OK', lat: 35.467, lng: -97.516 },
  { name: 'Moore, OK', lat: 35.339, lng: -97.486 },
  { name: 'Joplin, MO', lat: 37.084, lng: -94.513 },
  { name: 'Tuscaloosa, AL', lat: 33.209, lng: -87.569 },
];

const LocationSearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredLocations = MOCK_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(query.toLowerCase())
  );

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20"
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onClick={stopPropagation}
      onDoubleClick={stopPropagation}
      onWheel={stopPropagation}
      onTouchStart={stopPropagation}
      onTouchMove={stopPropagation}
    >
      <div className="relative">
        <div className={`glass-panel flex items-center px-4 py-2 transition-all ${isFocused ? 'ring-2 ring-axim-accent/50' : ''}`}>
          <SafeIcon icon={FiIcons.FiSearch} className="text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search location..."
            className="bg-transparent border-none outline-none text-white w-full placeholder-slate-500"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white">
              <SafeIcon icon={FiIcons.FiX} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isFocused && (query || true) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full mt-2 glass-panel overflow-hidden max-h-60 overflow-y-auto"
            >
              {filteredLocations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onLocationSelect(loc);
                    setQuery(loc.name);
                    setIsFocused(false);
                  }}
                  className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-800/50 hover:text-axim-accent transition-colors flex items-center gap-3 border-b border-slate-800/50 last:border-none"
                >
                  <SafeIcon icon={FiIcons.FiMapPin} className="text-slate-500" />
                  {loc.name}
                </button>
              ))}
              {filteredLocations.length === 0 && (
                <div className="px-4 py-3 text-slate-500 text-sm">No locations found.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LocationSearch;
