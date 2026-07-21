const fs = require('fs');

let content = `import React, { useState, useEffect } from 'react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [submittingThread, setSubmittingThread] = useState(false);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;

    setSubmittingThread(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (!userId) {
      setSubmittingThread(false);
      return;
    }

    const { data, error } = await supabase
      .from('forum_threads')
      .insert([{
        category_id: categoryId,
        author_id: userId,
        title: newThreadTitle.trim(),
        content: newThreadContent.trim()
      }])
      .select();

    setSubmittingThread(false);

    if (!error && data && data.length > 0) {
      setIsModalOpen(false);
      setNewThreadTitle('');
      setNewThreadContent('');
      navigate(\`/forums/\${categoryId}/thread/\${data[0].id}\`);
    }
  };

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

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SafeIcon icon={FiIcons.FiList} className="text-3xl text-axim-accent" />
            <h1 className="text-3xl font-bold text-white">{categoryName}</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-axim-accent text-axim-dark font-semibold rounded-lg hover:bg-axim-accent/90 transition-colors flex items-center gap-2 text-sm"
          >
            <FiIcons.FiPlus />
            New Thread
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-axim-dark w-full max-w-2xl rounded-xl border border-axim-accent/30 shadow-[0_0_20px_rgba(0,229,255,0.15)] overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FiIcons.FiPlusCircle className="text-axim-accent" />
                  Initiate New Thread
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <FiIcons.FiX className="text-2xl" />
                </button>
              </div>
              <form onSubmit={handleCreateThread} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="Enter thread title..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-axim-accent transition-colors font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Content</label>
                  <textarea
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Provide detailed intelligence..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-axim-accent transition-colors min-h-[150px] font-sans"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-medium rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingThread || !newThreadTitle.trim() || !newThreadContent.trim()}
                    className="px-6 py-2 bg-axim-accent text-axim-dark font-semibold rounded-lg hover:bg-axim-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submittingThread ? (
                      <>
                        <FiIcons.FiLoader className="animate-spin" />
                        Transmitting...
                      </>
                    ) : (
                      'Transmit Thread'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                key={thread.id} onClick={() => navigate(\`/forums/\${categoryId}/thread/\${thread.id}\`)}
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
`;

fs.writeFileSync('src/pages/ForumCategoryView.jsx', content);
