import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthContext';
import { 
  CalendarDays, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

export default function MyAttendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    percentage: 0,
    attended: 0,
    total: 0,
    streak: 0,
    bestStreak: 0
  });
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState({}); // { session_id: present_boolean }
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.student_id) {
        fetchAttendanceData();
      } else {
        setLoading(false);
      }
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch student profile details
      const { data: profile } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.student_id)
        .single();
      setStudentInfo(profile);

      // 2. Fetch all sessions
      const { data: allSessions } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });

      // 3. Fetch student's attendance
      const { data: myAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.student_id);

      const attendanceMap = {};
      myAttendance?.forEach(a => {
        attendanceMap[a.session_id] = a.present;
      });

      setSessions(allSessions || []);
      setAttendance(attendanceMap);

      // 4. Calculate stats
      const attendedCount = myAttendance?.filter(a => a.present).length || 0;
      const totalSessions = allSessions?.length || 0;
      const pct = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;

      // Calculate streak
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;
      
      // Sessions are desc, so reverse to calculate streak from past to now
      const sortedSessions = [...(allSessions || [])].reverse();
      sortedSessions.forEach(s => {
        if (attendanceMap[s.id] === true) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      });
      
      // Current streak (counting backwards from most recent session)
      let currentS = 0;
      for (const s of (allSessions || [])) {
        if (attendanceMap[s.id] === true) {
          currentS++;
        } else if (attendanceMap[s.id] === false || !attendanceMap[s.id]) {
          // If they missed a session or haven't marked yet, streak ends
          // Note: we usually count only until the last session they WERE active
          break;
        }
      }

      setStats({
        percentage: pct,
        attended: attendedCount,
        total: totalSessions,
        streak: currentS,
        bestStreak: maxStreak
      });

    } catch (err) {
      console.error("Error fetching student data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-tertiary">
        Initializing student profile...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-surface-raised rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-surface-raised rounded-2xl"></div>
          <div className="h-40 bg-surface-raised rounded-2xl"></div>
          <div className="h-40 bg-surface-raised rounded-2xl"></div>
        </div>
        <div className="h-96 bg-surface-raised rounded-2xl"></div>
      </div>
    );
  }

  const getStatusColor = (pct) => {
    if (pct >= 75) return 'text-success';
    if (pct >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getStatusBg = (pct) => {
    if (pct >= 75) return 'bg-success-bg border-success-border';
    if (pct >= 60) return 'bg-warning-bg border-warning-border';
    return 'bg-danger-bg border-danger-border';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Header & Student Profile */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display-lg text-primary font-display leading-tight">
            {studentInfo?.name || 'Student'}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-body-sm font-mono text-tertiary px-2 py-0.5 bg-surface-inset border border-subtle rounded">
              {studentInfo?.usn}
            </span>
            <span className="text-body-sm text-secondary flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-glow"></div>
              {studentInfo?.branch_code} • {studentInfo?.batch}
            </span>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-glow/20 to-success/20 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className={`relative px-8 py-6 rounded-2xl border ${getStatusBg(stats.percentage)} flex items-center gap-6 shadow-xl backdrop-blur-sm bg-surface/40 overflow-hidden`}>
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full opacity-10 blur-2xl ${stats.percentage >= 75 ? 'bg-success' : stats.percentage >= 60 ? 'bg-warning' : 'bg-danger'}`}></div>
            
            <div className="relative shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-surface-raised"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={226}
                  strokeDashoffset={226 - (226 * stats.percentage) / 100}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-out ${getStatusColor(stats.percentage)}`}
                />
              </svg>
              <span className={`absolute text-body-sm font-bold ${getStatusColor(stats.percentage)}`}>
                {Math.round(stats.percentage || 0)}%
              </span>
            </div>

            <div className="relative">
              <p className="text-micro text-secondary tracking-widest font-bold uppercase mb-1">Performance Index</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-display-md font-display leading-none ${getStatusColor(stats.percentage)}`}>
                  {(stats.percentage || 0).toFixed(1)}%
                </p>
                <span className="text-caption text-tertiary">Attendance</span>
              </div>
            </div>
            <div className="ml-auto p-3 bg-surface-raised rounded-xl">
              <TrendingUp size={24} className={getStatusColor(stats.percentage)} />
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Strip / Quick Stats */}
      <div className="flex flex-wrap items-center bg-surface bg-card-gradient border border-subtle rounded-2xl p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3 px-6 border-r border-subtle">
          <div className="p-2 bg-surface-raised rounded-lg text-accent-glow"><CalendarDays size={20} /></div>
          <div>
            <p className="text-caption text-tertiary uppercase tracking-wider">Sessions</p>
            <p className="text-body-lg font-bold text-primary">{stats.attended} / {stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 border-r border-subtle">
          <div className="p-2 bg-surface-raised rounded-lg text-warning"><Award size={20} /></div>
          <div>
            <p className="text-caption text-tertiary uppercase tracking-wider">Best Streak</p>
            <p className="text-body-lg font-bold text-primary">{stats.bestStreak} days</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6">
          <div className="p-2 bg-surface-raised rounded-lg text-success"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-caption text-tertiary uppercase tracking-wider">Current Streak</p>
            <p className="text-body-lg font-bold text-primary">{stats.streak} days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Heatmap Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface bg-card-gradient border border-subtle rounded-2xl p-6 shadow-[var(--shadow-card)]">
            <h3 className="text-h3 text-primary mb-6 flex items-center gap-2">
              <CalendarDays size={20} className="text-accent-glow" /> Attendance Heatmap
            </h3>
            
            <div className="grid grid-cols-7 gap-3">
              {/* Labels */}
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-tertiary text-center mb-1">{d}</div>
              ))}
              
              {/* We'll just render the last 28 sessions for the mini heatmap */}
              {[...sessions].reverse().slice(-28).map((s, i) => {
                const isPresent = attendance[s.id];
                return (
                  <div 
                    key={s.id}
                    title={`${s.date}: ${s.topic}`}
                    className={`
                      aspect-square rounded-md border flex items-center justify-center transition-all cursor-help
                      ${isPresent === true ? 'bg-success-bg border-success-border text-success' : 
                        isPresent === false ? 'bg-danger-bg border-danger-border text-danger' : 
                        'bg-surface-inset border-subtle text-tertiary opacity-30'}
                    `}
                  >
                    {isPresent === true ? <CheckCircle2 size={12} /> : 
                     isPresent === false ? <XCircle size={12} /> : null}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex items-center justify-between text-[11px] text-tertiary">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-success"></div> Present</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-danger"></div> Absent</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-surface-inset border border-subtle"></div> No Session</div>
            </div>
          </div>

          <div className="bg-surface border border-subtle rounded-2xl p-6 shadow-[var(--shadow-card)]">
            <h4 className="text-label text-tertiary uppercase tracking-widest mb-4">Program Tip</h4>
            <div className="flex gap-3">
              <Info size={18} className="text-accent-glow shrink-0 mt-0.5" />
              <p className="text-body-sm text-secondary italic">
                "Consistent attendance is the #1 predictor of success in the Forge AI-ML program. Keep that streak alive!"
              </p>
            </div>
          </div>
        </div>

        {/* Detailed History Table */}
        <div className="lg:col-span-2">
          <div className="bg-surface bg-card-gradient border border-subtle rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-6 border-b border-subtle flex justify-between items-center">
              <h3 className="text-h3 text-primary">Session History</h3>
              <div className="text-caption text-tertiary">Showing {sessions.length} sessions</div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-surface-raised border-b border-subtle">
                  <tr>
                    <th className="p-4 text-label text-tertiary">Date</th>
                    <th className="p-4 text-label text-tertiary">Topic</th>
                    <th className="p-4 text-label text-tertiary text-center">Status</th>
                    <th className="p-4 text-label text-tertiary text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {sessions.map(s => (
                    <tr key={s.id} className="hover:bg-surface-raised transition-colors group">
                      <td className="p-4 text-sm text-tertiary font-mono">
                        {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm text-primary font-medium group-hover:text-accent-glow transition-colors">
                        {s.topic}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`
                          inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${attendance[s.id] === true ? 'bg-success-bg text-success border border-success-border' : 
                            attendance[s.id] === false ? 'bg-danger-bg text-danger border border-danger-border' : 
                            'bg-surface-inset text-tertiary border border-subtle'}
                        `}>
                          {attendance[s.id] === true ? 'Present' : 
                           attendance[s.id] === false ? 'Absent' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-secondary text-right">
                        {s.duration_hours}h
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-20 text-center text-tertiary italic">
                        No sessions found. Start attending to see your history!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
