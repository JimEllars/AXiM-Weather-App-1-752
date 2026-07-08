import React, { createContext, useContext, useState, useEffect } from 'react';

const AximContext = createContext();

export const AximProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [safeZones, setSafeZones] = useState([
    { id: 1, name: 'Home Base', radius: '500m', active: true },
    { id: 2, name: 'Work HQ', radius: '200m', active: false }
  ]);
  const [activeSpotters, setActiveSpotters] = useState(8492);

  // Simulate fluctuating spotter count
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpotters(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AximContext.Provider value={{
      isLive, setIsLive,
      privacyMode, setPrivacyMode,
      safeZones, setSafeZones,
      activeSpotters
    }}>
      {children}
    </AximContext.Provider>
  );
};

export const useAxim = () => useContext(AximContext);