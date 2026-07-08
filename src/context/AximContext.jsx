import React, { createContext, useContext, useState, useMemo } from 'react';

const AximContext = createContext();

export const AximProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [safeZones, setSafeZones] = useState([
    { id: 1, name: 'Home Base', radius: '500m', active: true },
    { id: 2, name: 'Work HQ', radius: '200m', active: false }
  ]);
  const [activeSpotters, setActiveSpotters] = useState(0);

  const contextValue = useMemo(() => ({
    isLive, setIsLive,
    privacyMode, setPrivacyMode,
    safeZones, setSafeZones,
    activeSpotters, setActiveSpotters
  }), [isLive, privacyMode, safeZones, activeSpotters]);

  return (
    <AximContext.Provider value={contextValue}>
      {children}
    </AximContext.Provider>
  );
};

export const useAxim = () => useContext(AximContext);
