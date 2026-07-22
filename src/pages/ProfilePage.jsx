import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/Common/ProtectedRoute';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { supabase } from '../lib/supabase';

const ProfilePage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const handleExport = () => {
    if (submissions.length === 0) return;

    const headers = ['ID', 'Timestamp', 'Latitude', 'Longitude', 'Status', 'Media URL'];
    const csvRows = [headers.join(',')];

    for (const sub of submissions) {
      let status = 'Pending';
      if (sub.error_flag || (Date.now() - new Date(sub.created_at).getTime() > 10 * 60 * 1000 && !sub.verified && !sub.rejected)) {
          status = 'Error/Timeout';
      } else if (sub.verified) {
          status = 'Verified';
      } else if (sub.rejected) {
          status = 'Rejected';
      }
      const row = [
        sub.id,
        new Date(sub.created_at).toISOString(),
        sub.lat || '',
        sub.lng || '',
        status,
        sub.media_url || ''
      ];
      csvRows.push(row.map(v => `"${v}"`).join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'telemetry_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      // Set up Realtime subscription
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'telemetry_events',
            filter: `user_id=eq.${uid}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            setSubmissions((prevSubmissions) => {
              return prevSubmissions.map((sub) =>
                sub.id === payload.new.id ? { ...sub, ...payload.new } : sub
              );
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = fetchProfileData();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  const getStatusBadge = (sub) => {
    // Check for error flag or 10-minute timeout
    const isTimeout = (Date.now() - new Date(sub.created_at).getTime()) > 10 * 60 * 1000;

    if (sub.error_flag || (!sub.verified && !sub.rejected && isTimeout)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
          <FiIcons.FiAlertTriangle /> Validation Timeout / Error
        </span>
      );
    }

    if (sub.verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-axim-success/10 text-axim-success border border-axim-success/20">
          <FiIcons.FiCheckCircle /> Verified
        </span>
      );
    }

    if (sub.rejected) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-axim-danger/10 text-axim-danger border border-axim-danger/20">
          <FiIcons.FiXCircle /> Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
        <FiIcons.FiClock /> Pending
      </span>
    );
  };

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <SafeIcon icon={FiIcons.FiDatabase} className="text-axim-accent" />
                Onyx Mk3 Submissions
              </h2>
              <button
                onClick={handleExport}
                disabled={submissions.length === 0}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm rounded-lg border border-slate-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiIcons.FiDownload />
                Export History
              </button>
            </div>

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
                            {getStatusBadge(sub)}
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
