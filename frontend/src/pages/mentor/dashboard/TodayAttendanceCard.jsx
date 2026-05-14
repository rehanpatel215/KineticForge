import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { UserCheck } from 'lucide-react';

export default function TodayAttendanceCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTodayAttendance() {
      const today = new Date().toLocaleDateString('en-CA');
      
      try {
        // First get today's session
        const { data: session } = await supabase
          .from('sessions')
          .select('id')
          .eq('date', today)
          .maybeSingle();

        if (!session) {
          setLoading(false);
          return;
        }

        // Then get attendance for this session, joining student names
        const { data: attendance } = await supabase
          .from('attendance')
          .select(`
            present,
            students ( name )
          `)
          .eq('session_id', session.id);

        if (!attendance || attendance.length === 0) {
          setData({ marked: false });
        } else {
          const presentCount = attendance.filter(a => a.present).length;
          const totalCount = attendance.length;
          const absentees = attendance
            .filter(a => !a.present)
            .map(a => a.students?.name)
            .filter(Boolean);

          setData({
            marked: true,
            presentCount,
            totalCount,
            absentees
          });
        }
      } catch (err) {
        console.error("Error fetching today's attendance:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTodayAttendance();
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 h-full border border-white/5">
        <h2 className="text-micro text-tertiary mb-6 flex items-center gap-2">
          <UserCheck size={14} className="text-tertiary/50" /> Synchronization
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/5 rounded-xl w-full"></div>
          <div className="h-6 bg-white/5 rounded-lg w-full mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8 h-full flex flex-col group border border-white/5 hover:border-accent-glow/20 transition-all duration-500 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-accent-glow/5 blur-[100px] pointer-events-none group-hover:bg-accent-glow/10 transition-colors" />

      <div className="flex justify-between items-start mb-8">
        <div className="px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest">
          Attendance Metrics
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-tertiary group-hover:text-accent-glow transition-colors">
          <UserCheck size={20} />
        </div>
      </div>

      {!data ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 relative z-10">
          <p className="text-secondary font-medium italic">Waiting for session initialization...</p>
        </div>
      ) : !data.marked ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
            <UserCheck size={32} className="text-tertiary/30" />
          </div>
          <p className="text-secondary font-medium mb-8">Attendance data stream not yet active.</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="h-12 px-8 bg-accent-glow text-void rounded-2xl font-bold text-sm shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Mark Attendance
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-display-md text-primary tracking-tighter group-hover:neon-glow transition-all">{data.presentCount}</span>
              <span className="text-h3 text-tertiary/50">/ {data.totalCount}</span>
            </div>
            <span className="text-xs font-bold text-accent-glow uppercase tracking-widest mb-2">Verified Units</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5 relative">
            <div 
              className="h-full bg-gradient-to-r from-accent-glow to-accent-blue transition-all duration-1000 ease-out relative"
              style={{ width: `${(data.presentCount / Math.max(1, data.totalCount)) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          <div className="flex-1">
            <div className="text-micro text-tertiary mb-4">Missing Units Detected</div>
            {data.absentees.length === 0 ? (
              <div className="glass-card p-4 rounded-2xl border-success/20 bg-success/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success">🎉</div>
                <p className="text-sm text-success font-medium">All units accounted for. 100% efficiency.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {data.absentees.slice(0, 4).map((name, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 group/item hover:bg-white/10 transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                    <span className="text-xs text-secondary truncate">{name}</span>
                  </div>
                ))}
                {data.absentees.length > 4 && (
                  <div className="flex items-center justify-center px-3 py-2 rounded-xl border border-white/5 text-[10px] text-tertiary uppercase font-bold tracking-widest bg-white/[0.02]">
                    + {data.absentees.length - 4} More
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>

  );
}
