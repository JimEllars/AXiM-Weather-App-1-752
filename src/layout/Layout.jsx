import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import BrandLogo from '../components/Common/BrandLogo';
import { useAxim } from '../context/AximContext';


const ToastAlert = ({ alert, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 bg-axim-warning/20 border border-axim-warning/50 rounded-xl shadow-lg flex items-start gap-3 backdrop-blur-md">
        <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-axim-warning text-xl shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-white font-bold text-sm">{alert.title || 'System Alert'}</h4>
          <p className="text-slate-300 text-xs mt-1">{alert.message}</p>
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-white transition-colors">
          <SafeIcon icon={FiIcons.FiX} />
        </button>
      </div>
    </div>
  );
};


const Layout = ({ children }) => {
  const { activeSpotters, globalAlerts, setGlobalAlerts, userPreferences } = useAxim();
  const navigate = useNavigate();
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = React.useState(false);
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

        <div className="p-4 border-t border-slate-800 space-y-4">

          {/* Threat Condition UI */}
          <div className="px-3 py-2 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-colors flex flex-col gap-1" onClick={() => setIsAlertsDrawerOpen(true)}>
            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Threat Condition</span>
            {(() => {
                const highSeverityCount = globalAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
                if (highSeverityCount > 2) {
                   return <div className="text-red-400 text-xs font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>RED (ELEVATED)</div>;
                } else if (highSeverityCount > 0) {
                   return <div className="text-yellow-400 text-xs font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>YELLOW (CAUTION)</div>;
                }
                return <div className="text-green-400 text-xs font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div>GREEN (NOMINAL)</div>;
            })()}
          </div>

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

      {/* Global Alerts Toast */}
      {!userPreferences.muteToastNotifications && globalAlerts.map(alert => (
        <ToastAlert key={alert.id} alert={alert} onDismiss={() => setGlobalAlerts(prev => prev.filter(a => a.id !== alert.id))} />
      ))}

        {children}


      {/* Global Alerts Archive Drawer */}
      {isAlertsDrawerOpen && (
        <div className="absolute inset-0 z-[110] flex justify-end overflow-hidden pointer-events-auto">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAlertsDrawerOpen(false)}></div>

           {/* Drawer Panel */}
           <div className="relative w-full max-w-sm h-full bg-axim-panel border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <SafeIcon icon={FiIcons.FiShield} className="text-axim-accent" />
                  Threat Intelligence
                </h3>
                <button onClick={() => setIsAlertsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <SafeIcon icon={FiIcons.FiX} />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {globalAlerts.length === 0 ? (
                   <div className="text-center text-slate-500 py-10">No recent alerts recorded.</div>
                ) : (
                   globalAlerts.slice().reverse().slice(0, 10).map((alert, idx) => (
                     <div key={alert.id || idx} className="glass-panel p-4 rounded-xl border border-slate-700/50 relative overflow-hidden">
                       <div className={`absolute top-0 left-0 w-1 h-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-slate-500'}`}></div>
                       <div className="flex justify-between items-start mb-2">
                         <span className={`text-xs font-bold uppercase tracking-wider ${alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'high' ? 'text-orange-400' : alert.severity === 'medium' ? 'text-yellow-400' : 'text-slate-400'}`}>{alert.severity || 'Update'}</span>
                         <span className="text-[10px] text-slate-500 font-mono">{new Date(alert.created_at || Date.now()).toLocaleTimeString()}</span>
                       </div>
                       <h4 className="text-white text-sm font-semibold mb-1">{alert.title || 'System Message'}</h4>
                       <p className="text-slate-300 text-xs leading-relaxed">{alert.message || alert.content}</p>
                     </div>
                   ))
                )}
             </div>
           </div>
        </div>
      )}

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