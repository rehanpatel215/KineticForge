import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Calendar, Clock, Video, Users } from 'lucide-react';

export default function TodaySessionCard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTodaySession() {
      // Get today's date in YYYY-MM-DD local time
      const today = new Date().toLocaleDateString('en-CA');
      
      try {
        const { data } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', today)
          .maybeSingle(); // maybeSingle because it might not exist
          
        setSession(data);
      } catch (err) {
        console.error("Error fetching today's session:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTodaySession();
  }, []);

  if (loading) {
    return (
      <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full">
        <h2 className="text-h3 text-secondary mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-tertiary" /> Today's Session
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-inset rounded w-3/4"></div>
          <div className="h-4 bg-surface-inset rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] h-full flex flex-col">
      <h2 className="text-h3 text-secondary mb-6 flex items-center gap-2">
        <Calendar size={20} className="text-accent-glow" /> Today's Session
      </h2>

      {session ? (
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-h2 text-primary mb-2">{session.topic}</h3>
            
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-body text-secondary">
                <Clock size={16} />
                <span>{session.duration_hours} Hours</span>
              </div>
              <div className="flex items-center gap-2 text-body text-secondary capitalize">
                {session.session_type === 'online' ? <Video size={16} /> : <Users size={16} />}
                <span>{session.session_type}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/attendance')}
            className="mt-6 w-full bg-surface-raised text-primary border border-default rounded-md px-5 py-3 font-body text-[14px] hover:bg-surface transition-colors"
          >
            Manage Session
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-body text-secondary mb-6">No session scheduled for today.</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="bg-fg-primary text-void rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors"
          >
            Create Session
          </button>
        </div>
      )}
    </div>
  );
}
