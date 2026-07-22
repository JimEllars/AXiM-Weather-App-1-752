import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AximContext = createContext();

export const AximProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [safeZones, setSafeZones] = useState([
    { id: 1, name: 'Home Base', radius: '500m', active: true },
    { id: 2, name: 'Work HQ', radius: '200m', active: false }
  ]);
  const [activeSpotters, setActiveSpotters] = useState(0);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Initial session load from localStorage
    const localSession = localStorage.getItem('axim_active_session');
    if (localSession) {
      try {
        setSession(JSON.parse(localSession));
      } catch(e) {}
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        setSession(currentSession);
        localStorage.setItem('axim_active_session', JSON.stringify(currentSession));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('axim_active_session');
        setSession(null);
      } else if (newSession) {
        setSession(newSession);
        localStorage.setItem('axim_active_session', JSON.stringify(newSession));
      }
    });

    // Heartbeat and background retry logic
    const heartbeatInterval = setInterval(async () => {
      const currentSessionStr = localStorage.getItem('axim_active_session');
      if (currentSessionStr) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (!data.session) {
             const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
             if (refreshError) throw refreshError;
             if (refreshData.session) {
                setSession(refreshData.session);
                localStorage.setItem('axim_active_session', JSON.stringify(refreshData.session));
             }
          }
        } catch (err) {
          console.warn('Heartbeat token refresh failed, preserving local session state and retrying silently:', err);
        }
      }
    }, 60000); // 1 minute heartbeat

    return () => {
      subscription.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, []);

  const contextValue = useMemo(() => ({
    isLive, setIsLive,
    privacyMode, setPrivacyMode,
    safeZones, setSafeZones,
    activeSpotters, setActiveSpotters,
    session
  }), [isLive, privacyMode, safeZones, activeSpotters, session]);

  return (
    <AximContext.Provider value={contextValue}>
      {children}
    </AximContext.Provider>
  );
};

export const useAxim = () => useContext(AximContext);
