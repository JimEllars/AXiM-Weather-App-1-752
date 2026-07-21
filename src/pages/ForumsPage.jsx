import React from 'react';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const ForumsPage = () => {
  const categories = [
    { id: 1, title: 'General Weather', description: 'Discuss general weather patterns, forecasts, and models.', icon: FiIcons.FiCloud },
    { id: 2, title: 'Chaser Reports', description: 'Post and review on-the-ground reports from storm chasers.', icon: FiIcons.FiCamera },
    { id: 3, title: 'Hardware Setup', description: 'Equipment discussion: cameras, radar setups, and networking.', icon: FiIcons.FiCpu },
  ];

  return (
    <ProtectedRoute>
      <div className="h-full w-full bg-axim-dark overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <SafeIcon icon={FiIcons.FiMessageSquare} className="text-3xl text-axim-accent" />
            <h1 className="text-3xl font-bold text-white">Member Forums</h1>
          </div>

          <div className="grid gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="glass-panel p-6 border border-slate-700/50 hover:border-axim-accent/50 transition-colors cursor-pointer group flex items-start gap-4"
              >
                <div className="p-4 bg-slate-800/50 rounded-xl group-hover:bg-axim-accent/10 transition-colors">
                  <SafeIcon icon={category.icon} className="text-2xl text-axim-accent" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors">{category.title}</h2>
                  <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                </div>
                <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex flex-col items-center">
                    <span className="font-mono font-bold text-slate-300">0</span>
                    <span className="text-[10px] uppercase">Posts</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-mono font-bold text-slate-300">0</span>
                    <span className="text-[10px] uppercase">Topics</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ForumsPage;
