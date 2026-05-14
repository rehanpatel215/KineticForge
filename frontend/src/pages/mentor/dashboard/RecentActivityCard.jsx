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
      <div className="glass-card rounded-2xl p-6 h-full border border-white/5">
        <h2 className="text-micro text-tertiary mb-6 flex items-center gap-2">
          <Activity size={14} className="text-tertiary/50" /> Log Stream
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/5 rounded-lg w-full"></div>
          <div className="h-4 bg-white/5 rounded-lg w-full"></div>
          <div className="h-4 bg-white/5 rounded-lg w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8 h-full flex flex-col group border border-white/5 hover:border-accent-glow/20 transition-all duration-500 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-accent-glow/5 blur-[100px] pointer-events-none group-hover:bg-accent-glow/10 transition-colors" />

      <div className="flex justify-between items-start mb-8">
        <div className="px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest">
          Event Log Stream
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-tertiary group-hover:text-accent-glow transition-colors">
          <Activity size={20} />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center py-8 relative z-10">
          <p className="text-secondary italic">No telemetry data recorded.</p>
        </div>
      ) : (
        <div className="flex-1 relative z-10">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-white/5" />
          <ul className="space-y-6">
            {activities.map((activity, i) => (
              <li key={i} className="flex items-start gap-4 relative group/item">
                <div className="mt-1 w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center z-10 group-hover/item:bg-accent-glow/20 transition-all">
                  {activity.type === 'import' ? (
                    <UploadCloud size={14} className="text-tertiary group-hover/item:text-accent-glow" />
                  ) : (
                    <CheckSquare size={14} className="text-tertiary group-hover/item:text-accent-glow" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary leading-snug group-hover/item:text-accent-glow transition-colors">{activity.description}</p>
                  <p className="text-[10px] text-tertiary mt-1.5 font-bold uppercase tracking-widest">{formatRelativeTime(activity.timestamp)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

  );
}
