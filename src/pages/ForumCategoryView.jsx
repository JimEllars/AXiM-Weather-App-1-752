import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const ForumCategoryView = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('Loading...');

  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);

      // Fetch category details
      const { data: categoryData } = await supabase
        .from('forum_categories')
        .select('title')
        .eq('id', categoryId)
        .single();

      if (categoryData) setCategoryName(categoryData.title);

      // Fetch threads for this category
      const { data, error } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setThreads(data);
      }
      setLoading(false);
    };

    if (categoryId) {
      fetchThreads();
    }
  }, [categoryId]);

  return (
    <div className="h-full w-full bg-axim-dark overflow-y-auto p-4 md:p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">

        <button
          onClick={() => navigate('/forums')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <FiIcons.FiArrowLeft />
          Back to Categories
        </button>

        <div className="flex items-center gap-3 mb-8">
          <SafeIcon icon={FiIcons.FiList} className="text-3xl text-axim-accent" />
          <h1 className="text-3xl font-bold text-white">{categoryName}</h1>
        </div>

        <div className="grid gap-4">
          {loading ? (
            // Shimmer loading states
            [1, 2, 3].map((i) => (
              <div key={i} className="glass-panel p-6 border border-slate-700/50 flex flex-col gap-4 animate-pulse">
                <div className="h-5 bg-slate-800/50 rounded w-1/3"></div>
                <div className="h-4 bg-slate-800/50 rounded w-2/3"></div>
              </div>
            ))
          ) : threads.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400">
              No threads found in this category.
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="glass-panel p-4 md:p-6 border border-slate-700/50 hover:border-axim-accent/50 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">{thread.title}</h2>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiIcons.FiUser />
                      Operative #{thread.author_id?.substring(0, 4) || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiIcons.FiClock />
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/50 md:border-none">
                  <div className="flex items-center gap-1">
                    <FiIcons.FiMessageCircle className="text-axim-accent/70" />
                    <span className="font-mono font-bold text-slate-300">{thread.reply_count || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default ForumCategoryView;
