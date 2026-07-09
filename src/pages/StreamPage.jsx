import React, { useEffect, useState } from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import LiveChat from '../components/Stream/LiveChat';
import { supabase } from '../lib/supabase';

const StreamPage = () => {
  const [vodData, setVodData] = useState([]);

  useEffect(() => {
    const fetchVods = async () => {
      // Query events_ax2024 to mimic finding recent streams/clips
      const { data, error } = await supabase
        .from('events_ax2024')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
         // Map the data into format needed by UI. Fallback images for now.
         const mapped = data.map((event, idx) => {
           const images = [
              'https://images.unsplash.com/photo-1527482797697-8795b05a13fe',
              'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0',
              'https://images.unsplash.com/photo-1547683905-f686c993aae5'
           ];
           return {
              id: event.id,
              title: event.type === 'new_lead' ? `Lead: ${event.data.name}` : `Event: ${event.type}`,
              time: new Date(event.created_at).toLocaleDateString(),
              views: `${Math.floor(Math.random() * 20)}k`,
              img: images[idx % images.length]
           };
         });
         // Fill in if not enough data
         while (mapped.length < 3) {
            mapped.push({
              id: `fallback-${mapped.length}`,
              title: 'Axim Network Event',
              time: 'Just now',
              views: '1k',
              img: 'https://images.unsplash.com/photo-1605030424683-1463e2645eb4'
            });
         }
         setVodData(mapped);
      }
    };

    fetchVods();
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
            <span className="text-xs font-mono text-slate-500">4K STREAM // 60FPS</span>
            <div className="px-3 py-1 bg-axim-danger/20 text-axim-danger border border-axim-danger/50 rounded-full text-[10px] font-black tracking-widest">
              LIVE
            </div>
          </div>
        </div>

        {/* Primary Video Player */}
        <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden relative group shadow-2xl">
          <img src="https://images.unsplash.com/photo-1605030424683-1463e2645eb4?auto=format&fit=crop&q=80&w=1600" alt="Live Stream" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 flex flex-col justify-end">
             <div className="flex items-end justify-between">
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
        </div>

        {/* Recent Clips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vodData.map(video => (
            <div key={video.id} className="glass-panel overflow-hidden group cursor-pointer border-slate-700/30">
              <div className="aspect-video relative overflow-hidden">
                <img src={`${video.img}?auto=format&fit=crop&q=80&w=600`} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <SafeIcon icon={FiIcons.FiPlay} className="text-3xl text-axim-accent" />
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-xs line-clamp-1 text-slate-200">{video.title}</h3>
                <p className="text-[10px] text-slate-500 mt-1">{video.time} • {video.views} views</p>
              </div>
            </div>
          ))}
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
