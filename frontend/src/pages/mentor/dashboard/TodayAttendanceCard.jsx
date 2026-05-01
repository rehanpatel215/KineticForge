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
      <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full">
        <h2 className="text-h3 text-secondary mb-4 flex items-center gap-2">
          <UserCheck size={20} className="text-tertiary" /> Today's Attendance
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-surface-inset rounded w-full"></div>
          <div className="h-10 bg-surface-inset rounded w-full mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full flex flex-col">
      <h2 className="text-h3 text-secondary mb-6 flex items-center gap-2">
        <UserCheck size={20} className="text-accent-glow" /> Today's Attendance
      </h2>

      {!data ? (
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-body text-secondary">No session scheduled for today.</p>
        </div>
      ) : !data.marked ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-body text-secondary mb-6">Attendance not yet marked.</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="bg-fg-primary text-void rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors"
          >
            Mark Attendance
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-end mb-2">
            <span className="text-display-md text-primary">{data.presentCount} <span className="text-h3 text-tertiary">/ {data.totalCount}</span></span>
            <span className="text-body text-secondary font-medium">Present</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-surface-inset rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-success transition-all duration-500 ease-out"
              style={{ width: `${(data.presentCount / Math.max(1, data.totalCount)) * 100}%` }}
            ></div>
          </div>

          <div className="flex-1">
            <div className="text-label text-tertiary uppercase tracking-widest mb-3">Absentees</div>
            {data.absentees.length === 0 ? (
              <p className="text-sm text-success">Everyone is present! 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data.absentees.slice(0, 5).map((name, i) => (
                  <li key={i} className="text-sm text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger"></span>
                    {name}
                  </li>
                ))}
                {data.absentees.length > 5 && (
                  <li className="text-sm text-tertiary italic ml-3">
                    + {data.absentees.length - 5} more
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
