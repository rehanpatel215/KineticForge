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
          .single();

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

  const StatItem = ({ label, value }) => (
    <div className="flex flex-col">
      <span className="text-label text-tertiary uppercase tracking-widest">{label}</span>
      <span className="text-h3 text-primary mt-1">
        {loading ? <span className="animate-pulse bg-surface-inset h-6 w-16 inline-block rounded"></span> : value}
      </span>
    </div>
  );

  return (
    <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] flex flex-wrap gap-8 md:gap-16">
      <StatItem label="Total Sessions" value={stats.totalSessions} />
      <StatItem label="Overall Attendance" value={stats.overallAttendance} />
      <StatItem label="Active Students" value={stats.activeStudents} />
      <StatItem label="Last Session" value={stats.lastSessionDate} />
    </div>
  );
}
