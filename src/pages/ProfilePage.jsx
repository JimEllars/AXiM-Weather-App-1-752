import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const ProfilePage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      const { data, error } = await supabase
        .from('telemetry_events')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSubmissions(data);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="h-full w-full bg-axim-dark overflow-y-auto p-6 flex justify-center">
        <div className="w-full max-w-5xl space-y-8">

          <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-axim-accent to-blue-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.4)]">
              <SafeIcon icon={FiIcons.FiUser} className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Operative Profile</h1>
              <p className="text-slate-400 text-sm font-mono mt-1">ID: {userId || 'Loading...'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
              <SafeIcon icon={FiIcons.FiDatabase} className="text-axim-accent" />
              Onyx Mk3 Submissions
            </h2>

            <div className="glass-panel overflow-hidden border border-slate-700/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Timestamp</th>
                      <th className="p-4 font-medium">Location</th>
                      <th className="p-4 font-medium">Media</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500 animate-pulse">Loading secure data...</td>
                      </tr>
                    ) : submissions.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500">No telemetry submissions recorded.</td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 text-slate-300 whitespace-nowrap">
                            {new Date(sub.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-slate-300 font-mono text-xs">
                            {sub.lat ? `${sub.lat.toFixed(4)}, ${sub.lng?.toFixed(4)}` : 'Unknown'}
                          </td>
                          <td className="p-4 text-axim-accent">
                            {sub.media_url ? (
                              <a href={sub.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                <FiIcons.FiExternalLink /> View
                              </a>
                            ) : '-'}
                          </td>
                          <td className="p-4">
                            {sub.verified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-axim-success/10 text-axim-success border border-axim-success/20">
                                <FiIcons.FiCheckCircle /> Verified
                              </span>
                            ) : sub.rejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-axim-danger/10 text-axim-danger border border-axim-danger/20">
                                <FiIcons.FiXCircle /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                <FiIcons.FiClock /> Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ProfilePage;
