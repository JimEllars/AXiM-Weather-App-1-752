import React, { useState, useEffect, useRef } from 'react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

const MOCK_MESSAGES = [
  "Large hail reported in Norman!",
  "Radar showing strong rotation near Moore.",
  "Check the north side of the cell.",
  "Stay safe everyone!",
  "Onyx AI just confirmed a wall cloud submission."
];

const LiveChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: "StormChaser_99", text: "Visual on a wall cloud south of OKC.", time: "14:02" },
    { id: 2, user: "RadarOp_Alpha", text: "Velocity couplet tightening up.", time: "14:03" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef();
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newMessage = {
        id: Date.now(),
        user: `Spotter_${Math.floor(Math.random() * 9000 + 1000)}`,
        text: MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev.slice(-15), newMessage]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      user: "You (Spotter #8492)",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setInput("");
  };

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden border-slate-700/30">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h3 className="font-bold flex items-center gap-2">
          <SafeIcon icon={FiIcons.FiMessageSquare} className="text-axim-accent" />
          Live Field Intel
        </h3>
        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Encrypted</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-axim-accent">{msg.user}</span>
              <span className="text-[10px] text-slate-500">{msg.time}</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-2 rounded-lg group-hover:bg-slate-800/50 transition-colors">
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      {isAuthenticated ? (
        <form onSubmit={sendMessage} className="p-4 bg-slate-900/80 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send field report..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-axim-accent transition-colors"
          />
          <button className="p-2 bg-axim-accent text-axim-dark rounded-lg hover:scale-105 transition-transform">
            <SafeIcon icon={FiIcons.FiSend} />
          </button>
        </form>
      ) : (
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-center">
           <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-400 flex items-center gap-2">
             <SafeIcon icon={FiIcons.FiLock} className="text-slate-500" />
             <a href="/login" className="font-bold text-axim-accent hover:underline">Log in</a> to chat
           </div>
        </div>
      )}
    </div>
  );
};

export default LiveChat;