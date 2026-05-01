import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Flame, Award, CalendarDays } from 'lucide-react';

export default function StudentHistory() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('name');
      setStudents(data || []);
      setLoading(false);
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    async function fetchHistory() {
      const { data } = await supabase
        .from('attendance')
        .select(`
          present,
          marked_at,
          sessions (
            id, date, topic, duration_hours, session_type
          )
        `)
        .eq('student_id', selectedStudent.id)
        .order('sessions(date)', { ascending: true }); // We'll re-sort locally if needed
        
      if (data) {
        // Sort explicitly by date
        const sorted = data.sort((a, b) => new Date(a.sessions?.date) - new Date(b.sessions?.date));
        setAttendanceData(sorted);
      } else {
        setAttendanceData([]);
      }
    }
    fetchHistory();
  }, [selectedStudent]);

  const filteredStudents = search.trim() === '' 
    ? [] 
    : students.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.usn.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5);

  const handleSelect = (s) => {
    setSelectedStudent(s);
    setSearch('');
  };

  // Compute stats
  const stats = useMemo(() => {
    if (!attendanceData.length) return { present: 0, total: 0, percent: 0, currentStreak: 0, maxStreak: 0 };
    
    let present = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    attendanceData.forEach(row => {
      if (row.present) {
        present++;
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        currentStreak = tempStreak; // keeps updating if consecutive
      } else {
        tempStreak = 0;
        currentStreak = 0; // streak broken
      }
    });

    const total = attendanceData.length;
    const percent = Math.round((present / total) * 100);

    return { present, total, percent, currentStreak, maxStreak };
  }, [attendanceData]);

  const getPercentColor = (percent) => {
    if (percent >= 75) return 'text-success bg-success-bg border-success-border';
    if (percent >= 60) return 'text-warning bg-warning-bg border-warning-border';
    return 'text-danger bg-danger-bg border-danger-border';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Search Bar */}
      <div className="max-w-xl relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={20} />
          <input 
            type="text" 
            placeholder="Search student by name or USN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface bg-card-gradient border border-subtle rounded-xl pl-12 pr-4 h-[56px] text-primary text-[16px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none placeholder:text-tertiary"
          />
        </div>
        
        {search.trim() !== '' && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-subtle rounded-xl shadow-2xl overflow-hidden z-50">
            {filteredStudents.length > 0 ? (
              <ul>
                {filteredStudents.map(s => (
                  <li 
                    key={s.id} 
                    onClick={() => handleSelect(s)}
                    className="p-4 hover:bg-surface-raised cursor-pointer border-b border-subtle last:border-0 flex justify-between items-center"
                  >
                    <span className="text-body text-primary">{s.name}</span>
                    <span className="text-caption text-tertiary font-mono">{s.usn}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-secondary text-sm text-center">No students found.</div>
            )}
          </div>
        )}
      </div>

      {!selectedStudent && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-subtle rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-surface-inset flex items-center justify-center mb-4">
            <Search size={24} className="text-tertiary" />
          </div>
          <p className="text-body-lg text-secondary">Search for a student to view their history.</p>
        </div>
      )}

      {selectedStudent && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Profile */}
            <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-8 shadow-[var(--shadow-card)]">
              <div className="w-16 h-16 rounded-full bg-surface-raised border border-default flex items-center justify-center text-primary font-display text-2xl mb-6">
                {selectedStudent.name.charAt(0)}
              </div>
              <h2 className="text-h2 text-primary mb-1">{selectedStudent.name}</h2>
              <p className="text-body text-tertiary font-mono mb-6">{selectedStudent.usn}</p>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-subtle">
                  <span className="text-sm text-secondary">Branch</span>
                  <span className="text-sm font-medium text-primary">{selectedStudent.branch_code}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-subtle">
                  <span className="text-sm text-secondary">Batch</span>
                  <span className="text-sm font-medium text-primary">{selectedStudent.batch}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-secondary">Status</span>
                  {selectedStudent.is_active 
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-success-bg text-success border border-success-border">Active</span>
                    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-surface-raised text-secondary border border-default">Inactive</span>
                  }
                </div>
              </div>
            </div>

            {/* Right Card: Stats & Heatmap */}
            <div className="lg:col-span-2 bg-surface bg-card-gradient border border-subtle rounded-xl p-8 shadow-[var(--shadow-card)] flex flex-col">
              <div className="flex flex-wrap gap-4 mb-8">
                <div className={`px-4 py-3 rounded-lg border flex-1 min-w-[140px] flex flex-col justify-center ${getPercentColor(stats.percent)}`}>
                  <span className="text-label uppercase tracking-widest opacity-80 mb-1">Overall</span>
                  <span className="text-h2">{stats.percent}%</span>
                </div>
                <div className="px-4 py-3 rounded-lg border border-default bg-surface-inset text-primary flex-1 min-w-[140px] flex flex-col justify-center">
                  <span className="text-label text-tertiary uppercase tracking-widest mb-1 flex items-center gap-1"><Flame size={12}/> Current Streak</span>
                  <span className="text-h2">{stats.currentStreak}</span>
                </div>
                <div className="px-4 py-3 rounded-lg border border-default bg-surface-inset text-primary flex-1 min-w-[140px] flex flex-col justify-center">
                  <span className="text-label text-tertiary uppercase tracking-widest mb-1 flex items-center gap-1"><Award size={12}/> Best Streak</span>
                  <span className="text-h2">{stats.maxStreak}</span>
                </div>
              </div>

              {/* Heatmap */}
              <div className="flex-1">
                <h3 className="text-body-sm text-secondary mb-3 flex items-center gap-2">
                  <CalendarDays size={16} /> Attendance Heatmap
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attendanceData.map((row, i) => (
                    <div 
                      key={i} 
                      title={`${row.sessions?.date}: ${row.present ? 'Present' : 'Absent'}`}
                      className={`w-6 h-6 rounded-sm ${row.present ? 'bg-success' : 'bg-surface-inset border border-default'}`}
                    ></div>
                  ))}
                  {attendanceData.length === 0 && (
                    <div className="text-sm text-tertiary">No sessions recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface bg-card-gradient border border-subtle rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-6 border-b border-subtle">
              <h3 className="text-h3 text-primary">Session Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-inset border-b border-subtle">
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Date</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Topic</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Type</th>
                    <th className="p-4 text-label text-tertiary uppercase tracking-widest font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {attendanceData.map((row, i) => (
                    <tr key={i} className="hover:bg-surface-raised transition-colors">
                      <td className="p-4 text-sm text-secondary">{new Date(row.sessions?.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm text-primary font-medium">{row.sessions?.topic}</td>
                      <td className="p-4 text-sm text-tertiary capitalize">{row.sessions?.session_type}</td>
                      <td className="p-4">
                        {row.present 
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-success-bg text-success border border-success-border">Present</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-danger-bg text-danger border border-danger-border">Absent</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {attendanceData.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-sm text-tertiary">No sessions found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
