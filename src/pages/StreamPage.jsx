import React, { useEffect, useState } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import LiveChat from '../components/Stream/LiveChat';
import { supabase } from '../lib/supabase';

const StreamPage = () => {
  const [vodData, setVodData] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    const fetchVods = async () => {
      const { data, error } = await supabase
        .from('video_archives')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching VODs:', error);
      } else {
        setVodData(data || []);
      }
    };

    fetchVods();

    // Fetch initial app_settings
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1) // Assuming single row or similar
        .single();

      if (data) {
        setIsLive(data.is_live);
        setStreamUrl(data.stream_url);
      }
    };
    fetchSettings();

    // Subscribe to realtime changes on app_settings
    const channel = supabase.channel('schema-db-changes')
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

  return (
    <div className="h-full w-full bg-axim-dark overflow-hidden flex flex-col lg:flex-row">
      {/* Left side: Video & VODs */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <SafeIcon icon={FiIcons.FiRadio} className="text-axim-danger animate-pulse" />
            AXiM Live
          </h1>
          <div className="flex items-center gap-4">
            {isLive ? (
              <>
                <span className="text-xs font-mono text-slate-500">4K STREAM // 60FPS</span>
                <div className="px-3 py-1 bg-axim-danger/20 text-axim-danger border border-axim-danger/50 rounded-full text-[10px] font-black tracking-widest animate-pulse">
                  LIVE
                </div>
              </>
            ) : (
              <div className="px-3 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-[10px] font-black tracking-widest">
                OFFLINE
              </div>
            )}
          </div>
        </div>

        {/* Primary Video Player */}
        <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative group shadow-2xl flex items-center justify-center">
          {isLive ? (
            <>
              {/* In a real app you'd use a video player like video.js or hls.js here to play streamUrl */}
              <video src={streamUrl} autoPlay muted loop controls className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 flex flex-col justify-end pointer-events-none">
                 <div className="flex items-end justify-between pointer-events-auto">
                    <div>
                      <h2 className="text-xl font-bold text-white">Chasing the Dryline: Oklahoma Panhandle</h2>
                      <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <SafeIcon icon={FiIcons.FiMapPin} className="text-axim-accent" />
                        Near Woodward, OK
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors">
                        <SafeIcon icon={FiIcons.FiSettings} />
                      </button>
                      <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors">
                        <SafeIcon icon={FiIcons.FiMaximize} />
                      </button>
                    </div>
                 </div>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center gap-4 text-slate-500">
                <SafeIcon icon={FiIcons.FiVideoOff} className="text-4xl opacity-50" />
                <p className="font-medium tracking-widest text-sm">STREAM IS OFFLINE</p>
             </div>
          )}
        </div>

        {/* Recent Clips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vodData.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 font-medium">
              No archives available
            </div>
          ) : (
            vodData.map(video => (
              <div key={video.id} className="glass-panel overflow-hidden group cursor-pointer border-slate-700/30">
                <div className="aspect-video relative overflow-hidden">
                  <img src={`${video.thumbnail_url || 'https://images.unsplash.com/photo-1605030424683-1463e2645eb4'}?auto=format&fit=crop&q=80&w=600`} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <SafeIcon icon={FiIcons.FiPlay} className="text-3xl text-axim-accent" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-xs line-clamp-1 text-slate-200">{video.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1">{new Date(video.created_at).toLocaleDateString()} • {video.views || 0} views</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right side: Chat (Hidden on small screens, sidebar on large) */}
      <div className="w-full lg:w-96 border-l border-slate-800 bg-axim-panel/50 backdrop-blur-xl h-[400px] lg:h-full">
        <LiveChat />
      </div>
    </div>
  );
};

export default StreamPage;
