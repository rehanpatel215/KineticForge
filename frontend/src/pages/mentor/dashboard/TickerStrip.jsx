import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function TickerStrip() {
  const [stats, setStats] = useState({
    totalSessions: '-',
    overallAttendance: '-',
    activeStudents: '-',
    lastSessionDate: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTickerStats() {
      try {
        // 1. Total sessions
        const { count: sessionCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });

        // 2. Active students
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // 3. Last session date
        const { data: lastSession } = await supabase
          .from('sessions')
          .select('date')
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 4. Overall Attendance %
        const { count: totalPresent } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('present', true);
          
        const { count: totalAttendanceRows } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true });

        const attPercentage = totalAttendanceRows > 0 
          ? Math.round((totalPresent / totalAttendanceRows) * 100) + '%' 
          : '0%';

        setStats({
          totalSessions: sessionCount || 0,
          activeStudents: studentCount || 0,
          lastSessionDate: lastSession?.date ? new Date(lastSession.date).toLocaleDateString() : 'None',
          overallAttendance: attPercentage
        });
      } catch (err) {
        console.error("Ticker fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTickerStats();
  }, []);

  const StatItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-center gap-4 group/item">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-tertiary group-hover/item:text-accent-glow transition-all group-hover/item:shadow-neon">
        <Icon size={18} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-tertiary uppercase tracking-[0.2em] font-bold">{label}</span>
        <span className="text-xl font-display font-bold text-primary tracking-tight">
          {loading ? <span className="animate-pulse bg-white/5 h-6 w-12 inline-block rounded-md"></span> : value}
        </span>
      </div>
    </div>
  );

  return (
    <div className="glass-panel border-white/10 rounded-3xl p-6 flex flex-wrap gap-x-12 gap-y-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-accent-glow/5 via-transparent to-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <StatItem 
        label="Deployed Sessions" 
        value={stats.totalSessions} 
        icon={() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>}
      />
      <StatItem 
        label="System Integrity" 
        value={stats.overallAttendance} 
        icon={() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
      />
      <StatItem 
        label="Active Nodes" 
        value={stats.activeStudents} 
        icon={() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
      />
      <StatItem 
        label="Latest Sync" 
        value={stats.lastSessionDate} 
        icon={() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>}
      />
    </div>
  );
}

