import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const ForumThreadView = () => {
  const { categoryId, threadId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchThread = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      }

      // Fetch thread details
      const { data: threadData, error: threadError } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (!threadError && threadData) {
        setThread(threadData);
      }

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('forum_replies')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (!repliesError && repliesData) {
        setReplies(repliesData);
      }

      setLoading(false);
    };

    if (threadId) {
      fetchThread();
    }
  }, [threadId]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !userId) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('forum_replies')
      .insert([{
        thread_id: threadId,
        author_id: userId,
        content: replyText.trim()
      }])
      .select();

    if (!error && data) {
      setReplies([...replies, data[0]]);
      setReplyText('');

      // Update thread reply count implicitly handled by triggers or manual count,
      // For now we just increment local state if needed.
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-axim-dark overflow-y-auto p-4 md:p-6 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center gap-4 text-axim-accent">
          <FiIcons.FiLoader className="text-4xl animate-spin" />
          <p>Decrypting thread data...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="h-full w-full bg-axim-dark overflow-y-auto p-4 md:p-6 flex justify-center items-center">
         <div className="glass-panel p-8 text-center text-slate-400">
           Thread not found or access denied.
         </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-axim-dark overflow-y-auto p-4 md:p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">

        <button
          onClick={() => navigate(`/forums/${categoryId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-4"
        >
          <FiIcons.FiArrowLeft />
          Back to Category
        </button>

        <div className="glass-panel p-6 border border-axim-accent/30 rounded-xl mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{thread.title}</h1>
          <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-4 border-b border-slate-700/50">
            <span className="flex items-center gap-1">
              <FiIcons.FiUser />
              Operative #{thread.author_id?.substring(0, 4) || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <FiIcons.FiClock />
              {new Date(thread.created_at).toLocaleString()}
            </span>
          </div>
          <div className="text-slate-200 whitespace-pre-wrap font-sans">
            {thread.content}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-300 flex items-center gap-2 mb-4">
            <SafeIcon icon={FiIcons.FiMessageCircle} className="text-axim-accent" />
            Replies ({replies.length})
          </h2>

          {replies.length === 0 ? (
            <div className="text-center text-slate-500 py-8 border border-dashed border-slate-700/50 rounded-xl">
              No replies yet. Be the first to analyze this thread.
            </div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="glass-panel p-5 border border-slate-700/50 rounded-xl flex gap-4">
                 <div className="hidden md:flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                      <FiIcons.FiUser />
                    </div>
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-axim-accent">
                        Operative #{reply.author_id?.substring(0, 4) || 'Unknown'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(reply.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-300 text-sm whitespace-pre-wrap">
                      {reply.content}
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>

        {userId && (
          <div className="mt-8 glass-panel p-6 border border-slate-700/50 rounded-xl">
            <h3 className="text-lg font-medium text-white mb-4">Transmit Reply</h3>
            <form onSubmit={handleReplySubmit}>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter analysis or commentary..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-axim-accent transition-colors min-h-[120px] mb-4 font-sans"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-6 py-2 bg-axim-accent text-axim-dark font-semibold rounded-lg hover:bg-axim-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FiIcons.FiLoader className="animate-spin" />
                      Transmitting...
                    </>
                  ) : (
                    <>
                      <FiIcons.FiSend />
                      Transmit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForumThreadView;
