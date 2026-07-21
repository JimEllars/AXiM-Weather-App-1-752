import React from 'react';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

const ForumsPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return (
    <ProtectedRoute>
      <div className="h-full w-full bg-axim-dark overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <SafeIcon icon={FiIcons.FiMessageSquare} className="text-3xl text-axim-accent" />
            <h1 className="text-3xl font-bold text-white">Member Forums</h1>
          </div>

          <div className="grid gap-4">
            {loading ? (
              // Shimmer loading states
              [1, 2, 3].map((i) => (
                <div key={i} className="glass-panel p-6 border border-slate-700/50 flex items-start gap-4 animate-pulse">
                  <div className="p-4 bg-slate-800/50 rounded-xl w-14 h-14"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 bg-slate-800/50 rounded w-1/3"></div>
                    <div className="h-4 bg-slate-800/50 rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="glass-panel p-12 text-center text-slate-400">
                No forum categories available yet.
              </div>
            ) : (
              categories.map((category) => {
                const IconComponent = FiIcons[category.icon] || FiIcons.FiFolder;

                return (
                  <div
                    key={category.id}
                    className="glass-panel p-6 border border-slate-700/50 hover:border-axim-accent/50 transition-colors cursor-pointer group flex items-start gap-4"
                  >
                    <div className="p-4 bg-slate-800/50 rounded-xl group-hover:bg-axim-accent/10 transition-colors">
                      <SafeIcon icon={IconComponent} className="text-2xl text-axim-accent" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors">{category.title}</h2>
                      <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-300">{category.post_count || 0}</span>
                        <span className="text-[10px] uppercase">Posts</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-slate-300">{category.topic_count || 0}</span>
                        <span className="text-[10px] uppercase">Topics</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ForumsPage;
