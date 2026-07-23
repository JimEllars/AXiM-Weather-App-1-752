import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
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
  const [globalAlerts, setGlobalAlerts] = useState([]);
  const [session, setSession] = useState(null);
  const [isConnectionActive, setIsConnectionActive] = useState(true);

  const [userPreferences, setUserPreferences] = useState(() => {
    const saved = localStorage.getItem('axim_user_prefs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse user preferences from localStorage:", e);
      }
    }
    return {
      muteToastNotifications: false,
      highContrastRadar: false
    };
  });

  const hiddenTimeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('axim_user_prefs', JSON.stringify(userPreferences));
  }, [userPreferences]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Start 60 second timer to disconnect
        hiddenTimeoutRef.current = setTimeout(() => {
          console.log("Tab hidden for 60s, disabling active connections.");
          setIsConnectionActive(false);
        }, 60000);
      } else {
        // Tab is visible again
        if (hiddenTimeoutRef.current) {
          clearTimeout(hiddenTimeoutRef.current);
          hiddenTimeoutRef.current = null;
        }
        if (!isConnectionActive) {
          console.log("Tab visible, restoring active connections.");
          setIsConnectionActive(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (hiddenTimeoutRef.current) {
        clearTimeout(hiddenTimeoutRef.current);
      }
    };
  }, [isConnectionActive]);

  useEffect(() => {
    // Initial session load from localStorage
    const localSession = localStorage.getItem('axim_active_session');
    if (localSession) {
      try {
        setSession(JSON.parse(localSession));
      } catch(e) { console.warn("Failed to parse local session:", e); }
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


  useEffect(() => {
    let subscription;
    if (isConnectionActive) {
      subscription = supabase
        .channel('global_alerts_channel')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_alerts' }, (payload) => {
           setGlobalAlerts(prev => [...prev, payload.new]);
        })
        .subscribe();
    }
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isConnectionActive]);

  const contextValue = useMemo(() => ({
    isLive, setIsLive,
    globalAlerts, setGlobalAlerts,
    privacyMode, setPrivacyMode,
    safeZones, setSafeZones,
    activeSpotters, setActiveSpotters,
    session,
    isConnectionActive,
    userPreferences, setUserPreferences
  }), [isLive, globalAlerts, privacyMode, safeZones, activeSpotters, session, isConnectionActive, userPreferences]);

  return (
    <AximContext.Provider value={contextValue}>
      {children}
    </AximContext.Provider>
  );
};

export const useAxim = () => useContext(AximContext);
