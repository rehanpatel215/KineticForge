import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { BarChart3 } from 'lucide-react';

export default function ProgramOverviewCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        // 1. Total sessions
        const { count: totalSessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });

        // 2. Total active students
        const { count: totalStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // 3. Avg attendance %
        const { count: totalPresent } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('present', true);
        const { count: totalAttendanceRows } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true });
          
        const avgAttendance = totalAttendanceRows > 0 
          ? Math.round((totalPresent / totalAttendanceRows) * 100) 
          : 0;

        // 4. Highest and lowest attendance students
        // Doing this client-side for simplicity since dataset is small (25 students * 15 sessions = 375 rows)
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('student_id, present, students(name)');

        if (attendanceData && attendanceData.length > 0) {
          const studentStats = {};
          attendanceData.forEach(row => {
            if (!studentStats[row.student_id]) {
              studentStats[row.student_id] = { name: row.students?.name, present: 0, total: 0 };
            }
            studentStats[row.student_id].total += 1;
            if (row.present) studentStats[row.student_id].present += 1;
          });

          const studentsArray = Object.values(studentStats).map(s => ({
            name: s.name,
            percentage: s.total > 0 ? (s.present / s.total) * 100 : 0
          }));

          studentsArray.sort((a, b) => b.percentage - a.percentage);
          
          const highest = studentsArray[0];
          const lowest = studentsArray[studentsArray.length - 1];

          setData({
            totalSessions: totalSessions || 0,
            avgAttendance,
            highest,
            lowest
          });
        } else {
          setData({ totalSessions: totalSessions || 0, avgAttendance: 0, highest: null, lowest: null });
        }

      } catch (err) {
        console.error("Error fetching program overview:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full">
        <h2 className="text-h3 text-secondary mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-tertiary" /> Program Overview
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-surface-inset rounded w-1/2"></div>
          <div className="h-4 bg-surface-inset rounded w-3/4 mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full flex flex-col">
      <h2 className="text-h3 text-secondary mb-6 flex items-center gap-2">
        <BarChart3 size={20} className="text-accent-glow" /> Program Overview
      </h2>

      {data && (
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between p-4 bg-surface-inset border border-default rounded-lg">
            <span className="text-body text-secondary">Average Attendance</span>
            <span className="text-h2 text-primary">{data.avgAttendance}%</span>
          </div>

          <div className="space-y-4">
            {data.highest && (
              <div>
                <div className="text-label text-tertiary uppercase tracking-widest mb-1">Top Performer</div>
                <div className="flex items-center justify-between">
                  <span className="text-body text-primary truncate pr-4">{data.highest.name}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-body font-semibold text-[12px] bg-success-bg text-success border border-success-border whitespace-nowrap">
                    {Math.round(data.highest.percentage)}%
                  </span>
                </div>
              </div>
            )}
            
            {data.lowest && (
              <div>
                <div className="text-label text-tertiary uppercase tracking-widest mb-1">Needs Attention</div>
                <div className="flex items-center justify-between">
                  <span className="text-body text-primary truncate pr-4">{data.lowest.name}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full font-body font-semibold text-[12px] bg-danger-bg text-danger border border-danger-border whitespace-nowrap">
                    {Math.round(data.lowest.percentage)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
