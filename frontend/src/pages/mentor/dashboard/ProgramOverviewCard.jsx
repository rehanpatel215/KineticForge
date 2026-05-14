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
      <div className="glass-card rounded-2xl p-6 h-full border border-white/5">
        <h2 className="text-micro text-tertiary mb-6 flex items-center gap-2">
          <BarChart3 size={14} className="text-tertiary/50" /> Analytics Engine
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/5 rounded-xl w-3/4"></div>
          <div className="h-6 bg-white/5 rounded-lg w-full mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8 h-full flex flex-col group border border-white/5 hover:border-accent-glow/20 transition-all duration-500 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-accent-glow/5 blur-[100px] pointer-events-none group-hover:bg-accent-glow/10 transition-colors" />

      <div className="flex justify-between items-start mb-8">
        <div className="px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest">
          Performance Analytics
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-tertiary group-hover:text-accent-glow transition-colors">
          <BarChart3 size={20} />
        </div>
      </div>

      {data && (
        <div className="flex-1 flex flex-col justify-between space-y-8 relative z-10">
          <div className="glass-card p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group/metric overflow-hidden relative">
             <div className="absolute inset-0 bg-accent-glow/5 translate-x-full group-hover/metric:translate-x-0 transition-transform duration-700 ease-out" />
             <div className="relative">
               <div className="text-micro text-tertiary mb-1">Fleet Average</div>
               <div className="text-sm text-secondary font-medium uppercase tracking-widest">Attendance</div>
             </div>
             <div className="text-display-sm text-primary font-bold group-hover/metric:neon-glow transition-all relative">{data.avgAttendance}%</div>
          </div>

          <div className="space-y-6">
            {data.highest && (
              <div className="group/item">
                <div className="text-[10px] text-tertiary uppercase tracking-[0.2em] mb-2 font-bold flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                   Apex Performer
                </div>
                <div className="flex items-center justify-between glass-card p-3 rounded-xl border-white/5 hover:bg-white/5 transition-all">
                  <span className="text-sm text-primary font-medium truncate pr-4">{data.highest.name}</span>
                  <span className="text-xs font-bold text-success neon-glow">{Math.round(data.highest.percentage)}%</span>
                </div>
              </div>
            )}
            
            {data.lowest && (
              <div className="group/item">
                <div className="text-[10px] text-tertiary uppercase tracking-[0.2em] mb-2 font-bold flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                   System Alert
                </div>
                <div className="flex items-center justify-between glass-card p-3 rounded-xl border-white/5 hover:bg-white/5 transition-all">
                  <span className="text-sm text-primary font-medium truncate pr-4">{data.lowest.name}</span>
                  <span className="text-xs font-bold text-danger">{Math.round(data.lowest.percentage)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );
}
