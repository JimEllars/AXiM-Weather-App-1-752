import React from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const BrandLogo = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "text-lg gap-1.5",
    md: "text-2xl gap-2",
    lg: "text-4xl gap-3"
  };

  return (
    <div className={`flex items-center font-black tracking-tighter text-white ${sizes[size]} ${className}`}>
      <div className="relative">
        <SafeIcon icon={FiIcons.FiWind} className="text-axim-accent" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-axim-danger rounded-full animate-pulse"></div>
      </div>
      <span className="flex items-center">
        AXiM
        <span className="text-axim-accent ml-1 font-light italic">WEATHER</span>
      </span>
    </div>
  );
};

export default BrandLogo;