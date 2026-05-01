import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthContext';
import { Calendar, Users, AlertTriangle, Check, X as XIcon } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function MarkAttendance() {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: boolean }
  const [isExistingAttendance, setIsExistingAttendance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Session creation form state
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('offline');
  const [duration, setDuration] = useState(2.0);
  
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDataForDate(date);
  }, [date]);

  async function fetchDataForDate(selectedDate) {
    setLoading(true);
    setSession(null);
    setIsExistingAttendance(false);
    setAttendance({});
    
    try {
      // Fetch active students
      const { data: studentData } = await supabase
        .from('students')
        .select('id, name, usn')
        .eq('is_active', true)
        .order('name');
        
      setStudents(studentData || []);
      
      const initialMap = {};
      studentData?.forEach(s => initialMap[s.id] = false);

      // Fetch session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('date', selectedDate)
        .maybeSingle();

      if (sessionData) {
        setSession(sessionData);
        // Fetch existing attendance
        const { data: attData } = await supabase
          .from('attendance')
          .select('student_id, present')
          .eq('session_id', sessionData.id);
          
        if (attData && attData.length > 0) {
          setIsExistingAttendance(true);
          attData.forEach(row => {
            initialMap[row.student_id] = row.present;
          });
        }
      }
      
      setAttendance(initialMap);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const monthNum = new Date(date).getMonth() + 1;
      const { data, error } = await supabase
        .from('sessions')
        .insert([{
          date,
          topic,
          session_type: type,
          duration_hours: duration,
          month_number: monthNum
        }])
        .select()
        .single();
        
      if (error) throw error;
      setSession(data);
    } catch (err) {
      alert("Failed to create session: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (isExistingAttendance) {
      setShowConfirmModal(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setSaving(true);
    setShowConfirmModal(false);
    
    try {
      const records = students.map(s => ({
        student_id: s.id,
        session_id: session.id,
        present: attendance[s.id] || false,
        marked_by: user.display_name
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,session_id' });

      if (error) throw error;

      const presentCount = Object.values(attendance).filter(Boolean).length;
      alert(`Marked ${presentCount} present, ${students.length - presentCount} absent.`);
      navigate('/dashboard');

    } catch (err) {
      alert("Failed to save attendance: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (id) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setAll = (val) => {
    const newMap = {};
    students.forEach(s => newMap[s.id] = val);
    setAttendance(newMap);
  };

  const today = new Date().toLocaleDateString('en-CA');
  const minDate = '2025-08-04';

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      
      <div className="mb-8">
        <h1 className="text-display-md text-primary font-display mb-2">Mark Attendance</h1>
        <p className="text-body text-secondary">Record attendance for bootcamp sessions.</p>
      </div>

      <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] mb-8">
        <div className="flex flex-col md:flex-row gap-6 md:items-end">
          <div className="flex-1">
            <label className="block text-label text-secondary uppercase tracking-widest mb-2">Session Date</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
              <input 
                type="date"
                max={today}
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-inset border border-default rounded-md pl-10 pr-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none [color-scheme:dark]"
              />
            </div>
          </div>
          
          <div className="flex-[2]">
            {!loading && session && (
              <div className="h-[44px] flex items-center px-4 bg-surface-raised border border-default rounded-md">
                <span className="text-primary font-medium mr-4">{session.topic}</span>
                <span className="text-tertiary text-sm capitalize">{session.session_type} • {session.duration_hours}h</span>
              </div>
            )}
            {!loading && !session && (
              <div className="h-[44px] flex items-center text-warning font-medium">
                No session scheduled for this date.
              </div>
            )}
            {loading && (
              <div className="h-[44px] flex items-center">
                <div className="animate-pulse h-6 bg-surface-inset rounded w-1/2"></div>
              </div>
            )}
          </div>
        </div>

        {!loading && !session && (
          <form onSubmit={handleCreateSession} className="mt-6 pt-6 border-t border-subtle flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-[2] w-full">
              <label className="block text-label text-secondary uppercase tracking-widest mb-2">Topic</label>
              <input required type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. React State Management" className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary focus:border-accent-glow outline-none" />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-label text-secondary uppercase tracking-widest mb-2">Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none">
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-label text-secondary uppercase tracking-widest mb-2">Hours</label>
              <input required type="number" step="0.5" min="0.5" value={duration} onChange={e=>setDuration(e.target.value)} className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none" />
            </div>
            <button disabled={saving} type="submit" className="w-full md:w-auto h-[44px] bg-fg-primary text-void rounded-md px-5 font-medium hover:bg-[#E5E5E7] transition-colors">
              Create
            </button>
          </form>
        )}
      </div>

      {session && (
        <div className="bg-surface bg-card-gradient border border-subtle rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
          <div className="p-6 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-h3 text-secondary flex items-center gap-2">
              <Users size={20} className="text-accent-glow" /> Student Roster
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setAll(true)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors">All Present</button>
              <button onClick={() => setAll(false)} className="px-3 py-1.5 rounded-md text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors">All Absent</button>
            </div>
          </div>

          <div className="divide-y divide-subtle">
            {students.map(student => (
              <label key={student.id} className="flex items-center p-4 hover:bg-surface-raised cursor-pointer transition-colors group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    checked={attendance[student.id] || false}
                    onChange={() => toggleStudent(student.id)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border border-default rounded bg-surface-inset peer-checked:bg-accent-glow peer-checked:border-accent-glow transition-colors flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-body text-primary group-hover:text-accent-glow transition-colors">{student.name}</p>
                </div>
                <div className="text-sm text-tertiary font-mono">
                  {student.usn}
                </div>
                <div className="ml-6 w-24 text-right">
                  {attendance[student.id] ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-success">
                      <Check size={14} /> Present
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-danger">
                      <XIcon size={14} /> Absent
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="p-6 border-t border-subtle bg-surface-raised flex justify-end">
            <button 
              onClick={handleSaveClick}
              disabled={saving}
              className="bg-fg-primary text-void rounded-md px-8 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors disabled:opacity-50 shadow-lg shadow-fg-primary/10"
            >
              {saving ? 'Saving...' : (isExistingAttendance ? 'Update Attendance' : 'Save Attendance')}
            </button>
          </div>
        </div>
      )}

      {loading && !session && (
        <div className="bg-surface border border-subtle rounded-xl p-8 space-y-4 animate-pulse">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="flex items-center gap-4 py-2 border-b border-subtle last:border-0">
              <div className="w-5 h-5 bg-surface-inset rounded"></div>
              <div className="h-4 bg-surface-inset rounded w-1/3"></div>
              <div className="ml-auto h-4 bg-surface-inset rounded w-20"></div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeSave}
        title="Overwrite Attendance?"
        message="Attendance has already been marked for this session. Proceeding will overwrite the existing records."
        confirmText="Yes, Overwrite"
        type="danger"
      />

    </div>
  );
}
