import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import BrandLogo from '../components/Common/BrandLogo';
import { useAxim } from '../context/AximContext';

const Layout = ({ children }) => {
  const { activeSpotters } = useAxim();
  const navigate = useNavigate();
  const navItems = [
    { id: 'map', path: '/map', icon: FiIcons.FiMap, label: 'Radar' },
    { id: 'submit', path: '/submit', icon: FiIcons.FiCamera, label: 'Report' },
    { id: 'stream', path: '/stream', icon: FiIcons.FiRadio, label: 'Live Hub' },
    { id: 'forums', path: '/forums', icon: FiIcons.FiMessageSquare, label: 'Forums' },
    { id: 'settings', path: '/settings', icon: FiIcons.FiShield, label: 'Privacy' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-axim-dark overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-axim-panel border-b border-slate-800 z-50">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-axim-accent font-bold leading-none">{activeSpotters}</span>
            <span className="text-[8px] text-slate-500 uppercase leading-none">Net</span>
          </div>
          <button onClick={() => navigate('/profile')} className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <SafeIcon icon={FiIcons.FiUser} />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-20 lg:w-64 bg-axim-panel border-r border-slate-800 z-50">
        <div className="p-6 border-b border-slate-800">
          <BrandLogo size="md" className="hidden lg:flex" />
          <div className="lg:hidden flex justify-center">
            <SafeIcon icon={FiIcons.FiWind} className="text-axim-accent text-3xl" />
          </div>
        </div>
        
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 p-3 rounded-xl transition-all duration-200
                ${isActive ? 'bg-axim-accent/10 text-axim-accent' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
              `}
            >
              <SafeIcon icon={item.icon} className="text-xl shrink-0" />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-axim-accent to-blue-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,229,255,0.3)] group-hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] transition-shadow">
              <SafeIcon icon={FiIcons.FiUser} className="text-white" />
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">Spotter #8492</p>
              <p className="text-[10px] text-axim-success flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-axim-success animate-pulse"></span>
                {activeSpotters} NETWORK
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 relative overflow-hidden">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden flex items-center justify-around p-3 bg-axim-panel border-t border-slate-800 z-50 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 p-2 transition-colors
              ${isActive ? 'text-axim-accent' : 'text-slate-400'}
            `}
          >
            <SafeIcon icon={item.icon} className="text-2xl" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Layout;