import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { useAxim } from '../context/AximContext';

const SettingsPage = () => {
  const { privacyMode, setPrivacyMode, safeZones, userPreferences, setUserPreferences } = useAxim();

  const handleTogglePreference = (key) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4 md:p-8 bg-axim-dark">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SafeIcon icon={FiIcons.FiSettings} className="text-axim-accent" />
            Operative Settings
          </h1>
          <p className="text-slate-400 mt-2">Manage your UI preferences, location obfuscation and safe zone logic.</p>
        </header>

        <section className="glass-panel p-6 space-y-6">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-2">Interface Preferences</h2>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Mute Toast Notifications</h3>
              <p className="text-sm text-slate-400">Disable non-critical system alerts and popups.</p>
            </div>
            <button
              onClick={() => handleTogglePreference('muteToastNotifications')}
              className={`w-14 h-7 rounded-full transition-colors relative ${userPreferences.muteToastNotifications ? 'bg-axim-accent' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${userPreferences.muteToastNotifications ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Default to High-Contrast Radar</h3>
              <p className="text-sm text-slate-400">Force radar overlays to render with maximum opacity and high-visibility palettes.</p>
            </div>
            <button
              onClick={() => handleTogglePreference('highContrastRadar')}
              className={`w-14 h-7 rounded-full transition-colors relative ${userPreferences.highContrastRadar ? 'bg-axim-accent' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${userPreferences.highContrastRadar ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </section>

        <section className="glass-panel p-6 space-y-6">
          <h2 className="text-xl font-bold border-b border-slate-700 pb-2">Privacy & Guardrails</h2>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Location Obfuscation</h3>
              <p className="text-sm text-slate-400">Randomize precise coordinates by ±10m for public view.</p>
            </div>
            <button 
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`w-14 h-7 rounded-full transition-colors relative ${privacyMode ? 'bg-axim-accent' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${privacyMode ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-bold mb-4">Configured Safe Zones</h3>
            <div className="space-y-3">
              {safeZones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-axim-accent/10 rounded-lg text-axim-accent">
                      <SafeIcon icon={FiIcons.FiHome} />
                    </div>
                    <div>
                      <p className="font-bold">{zone.name}</p>
                      <p className="text-xs text-slate-500">Radius: {zone.radius}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><SafeIcon icon={FiIcons.FiEdit2} /></button>
                    <button className="p-2 hover:bg-axim-danger/20 rounded-lg text-axim-danger"><SafeIcon icon={FiIcons.FiTrash2} /></button>
                  </div>
                </div>
              ))}
              <button className="w-full p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-axim-accent hover:text-axim-accent transition-all flex items-center justify-center gap-2 font-bold">
                <SafeIcon icon={FiIcons.FiPlus} />
                Add New Safe Zone
              </button>
            </div>
          </div>
        </section>

        <section className="glass-panel p-6 border-l-4 border-l-axim-warning bg-axim-warning/5">
          <div className="flex gap-4">
            <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-2xl text-axim-warning shrink-0" />
            <div>
              <h3 className="font-bold">Data Retention Policy</h3>
              <p className="text-sm text-slate-300 mt-1">
                Historical location data is purged every 24 hours. AXiM Core does not store permanent tracking logs for standard spotters.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
