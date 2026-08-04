import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const AximContext = createContext();

export const AximProvider = ({ children }) => {
  const [isLive, setIsLive] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
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
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (data) {
        setIsLive(data.is_live);
        setStreamUrl(data.stream_url);
      }
    };
    fetchSettings();

    const channel = supabase.channel('app-settings-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_settings' },
        (payload) => {
          setIsLive(payload.new.is_live);
          setStreamUrl(payload.new.stream_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    const verifyPushSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window && session?.user?.id) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const currentSubscription = await registration.pushManager.getSubscription();
          const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

          if (!currentSubscription) {
             console.log("No push subscription found, renegotiating...");
             const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
             });

             await supabase.from('push_subscriptions').upsert({
               user_id: session.user.id,
               subscription: JSON.parse(JSON.stringify(newSubscription)),
               is_active: true
             }, { onConflict: 'user_id' });
             console.log("Push subscription renegotiated and saved.");

          } else {
             // In a real app we'd verify the keys match, but checking existence is good for this sprint
             console.log("Push subscription is active.");
          }
        } catch (error) {
          console.error("Error verifying push subscription:", error);
        }
      }
    };

    // Run verification if session exists and is active
    if (session && isConnectionActive) {
      verifyPushSubscription();
    }
  }, [session, isConnectionActive]);





  useEffect(() => {
    const drainOfflineQueue = async () => {
      if (!navigator.onLine || !session?.user?.id) return;

      const request = indexedDB.open('axim-offline-queue', 1);
      request.onsuccess = async (event) => {
        const db = event.target.result;
        // Proceed only if the object store exists
        if (!db.objectStoreNames.contains('telemetry')) return;

        const transaction = db.transaction('telemetry', 'readwrite');
        const store = transaction.objectStore('telemetry');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = async () => {
          const items = getAllRequest.result;
          if (items && items.length > 0) {
            console.log(`Found ${items.length} items in offline queue, draining sequentially...`);

            for (const item of items) {
              try {
                // Upload Blob to storage if it exists
                let mediaUrl = null;
                if (item.blob) {
                   const fileName = `telemetry_${session.user.id}_${item.timestamp}.jpg`;
                   const { data: storageData, error: storageError } = await supabase.storage
                      .from('telemetry_media')
                      .upload(fileName, item.blob, { contentType: item.blob.type || 'image/jpeg' });

                   if (storageError) {
                      console.error("Failed to upload offline media:", storageError);
                      throw storageError; // Rethrow to skip db insert and keep in queue
                   }

                   const { data: { publicUrl } } = supabase.storage
                      .from('telemetry_media')
                      .getPublicUrl(fileName);

                   mediaUrl = publicUrl;
                }

                // Insert into database
                const { error: dbError } = await supabase.from('telemetry_events').insert({
                  user_id: session.user.id,
                  ...item.metadata,
                  media_url: mediaUrl
                });

                if (dbError) throw dbError;

                // Delete from IDB on success
                const delTx = db.transaction('telemetry', 'readwrite');
                delTx.objectStore('telemetry').delete(item.id);
                console.log(`Successfully synced offline item ${item.id}`);

              } catch (err) {
                 console.error(`Failed to sync offline item ${item.id}, retaining in queue.`, err);
                 // Stop draining to prevent out-of-order issues or cascading failures if backend is down
                 break;
              }
            }

            // Check remaining
            const checkTx = db.transaction('telemetry', 'readonly');
            const checkReq = checkTx.objectStore('telemetry').count();
            checkReq.onsuccess = () => {
               if (checkReq.result < items.length) {
                  setGlobalAlerts(prev => [...prev, { id: Date.now(), title: 'Sync Complete', message: 'Cached reports synced.', severity: 'medium' }]);
               }
            };
          }
        };
      };
    };

    window.addEventListener('online', drainOfflineQueue);
    // Attempt drain on mount if online
    if (navigator.onLine) {
        drainOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', drainOfflineQueue);
    };
  }, [session]);

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
    streamUrl, setStreamUrl,
    globalAlerts, setGlobalAlerts,
    privacyMode, setPrivacyMode,
    safeZones, setSafeZones,
    activeSpotters, setActiveSpotters,
    session,
    isConnectionActive,
    userPreferences, setUserPreferences
  }), [isLive, streamUrl, globalAlerts, privacyMode, safeZones, activeSpotters, session, isConnectionActive, userPreferences]);

  return (
    <AximContext.Provider value={contextValue}>
      {children}
    </AximContext.Provider>
  );
};

export const useAxim = () => useContext(AximContext);
