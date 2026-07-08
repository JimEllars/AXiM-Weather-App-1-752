import React from 'react';
import { motion } from 'framer-motion';

const ClusterMarker = ({ count, totalPoints, onClick }) => {
  // Size calculation based on point count
  const size = Math.max(36, Math.min(80, 30 + (count / totalPoints) * 200));
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="relative cursor-pointer group"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-axim-accent/20 rounded-full animate-ping opacity-75"></div>
      <div className="absolute inset-0 bg-axim-panel/90 border-2 border-axim-accent rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)] backdrop-blur-sm transition-transform group-hover:scale-110">
        <span className="text-white font-bold text-sm">
          {count > 999 ? `${(count/1000).toFixed(1)}k` : count}
        </span>
      </div>
    </motion.div>
  );
};

export default ClusterMarker;