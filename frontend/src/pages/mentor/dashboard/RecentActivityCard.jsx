import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Activity, UploadCloud, CheckSquare } from 'lucide-react';

export default function RecentActivityCard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        // Fetch recent attendance marks (grouped by session via distinct marked_at if possible, 
        // but Supabase JS doesn't support complex distinct easily, so we just order and dedup manually)
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('marked_at, marked_by, session_id, sessions(topic)')
          .order('marked_at', { ascending: false })
          .limit(20);

        // Fetch recent imports
        const { data: importData } = await supabase
          .from('import_log')
          .select('uploaded_at, uploaded_by, filename')
          .order('uploaded_at', { ascending: false })
          .limit(5);

        // Dedup attendance by session_id
        const uniqueSessions = new Set();
        const attendanceEvents = [];
        if (attendanceData) {
          for (const row of attendanceData) {
            if (!uniqueSessions.has(row.session_id) && row.marked_at) {
              uniqueSessions.add(row.session_id);
              attendanceEvents.push({
                type: 'attendance',
                timestamp: new Date(row.marked_at),
                description: `${row.marked_by} marked attendance for "${row.sessions?.topic}"`
              });
            }
          }
        }

        const importEvents = (importData || []).map(row => ({
          type: 'import',
          timestamp: new Date(row.uploaded_at),
          description: `${row.uploaded_by} imported CSV "${row.filename}"`
        }));

        // Combine, sort by time desc, take top 5
        const allEvents = [...attendanceEvents, ...importEvents]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        setActivities(allEvents);
      } catch (err) {
        console.error("Error fetching recent activity:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  const formatRelativeTime = (date) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((date - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) {
      const hoursDiff = Math.round((date - new Date()) / (1000 * 60 * 60));
      if (hoursDiff === 0) return 'Just now';
      return rtf.format(hoursDiff, 'hour');
    }
    return rtf.format(daysDifference, 'day');
  };

  if (loading) {
    return (
      <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full">
        <h2 className="text-h3 text-secondary mb-4 flex items-center gap-2">
          <Activity size={20} className="text-tertiary" /> Recent Activity
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-surface-inset rounded w-full"></div>
          <div className="h-4 bg-surface-inset rounded w-full"></div>
          <div className="h-4 bg-surface-inset rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full flex flex-col">
      <h2 className="text-h3 text-secondary mb-6 flex items-center gap-2">
        <Activity size={20} className="text-accent-glow" /> Recent Activity
      </h2>

      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-body text-secondary">No recent activity.</p>
        </div>
      ) : (
        <ul className="flex-1 space-y-5">
          {activities.map((activity, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5">
                {activity.type === 'import' ? (
                  <UploadCloud size={16} className="text-tertiary" />
                ) : (
                  <CheckSquare size={16} className="text-tertiary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-primary line-clamp-2">{activity.description}</p>
                <p className="text-caption text-tertiary mt-1">{formatRelativeTime(activity.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
