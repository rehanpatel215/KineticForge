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
      <div className="glass-card rounded-2xl p-6 h-full border border-white/5">
        <h2 className="text-micro text-tertiary mb-6 flex items-center gap-2">
          <Calendar size={14} className="text-tertiary/50" /> Live Status
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/5 rounded-xl w-3/4"></div>
          <div className="h-4 bg-white/5 rounded-lg w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-8 h-full flex flex-col group border border-white/5 hover:border-accent-glow/20 transition-all duration-500 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent-glow/5 blur-[100px] pointer-events-none group-hover:bg-accent-glow/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-8">
        <div className="px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest">
          Active Session
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-tertiary group-hover:text-accent-glow transition-colors">
          <Calendar size={20} />
        </div>
      </div>

      {session ? (
        <div className="flex-1 flex flex-col justify-between relative z-10">
          <div>
            <h3 className="text-display-sm text-primary mb-3 leading-tight tracking-tight group-hover:neon-glow transition-all">{session.topic}</h3>
            
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-secondary text-xs font-medium border border-white/5">
                <Clock size={14} className="text-accent-glow" />
                <span>{session.duration_hours}h Duration</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 text-secondary text-xs font-medium border border-white/5 capitalize">
                {session.session_type === 'online' ? <Video size={14} className="text-accent-glow" /> : <Users size={14} className="text-accent-glow" />}
                <span>{session.session_type} Link</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/attendance')}
            className="mt-10 w-full h-12 glass-card bg-white/5 hover:bg-white/10 text-primary border border-white/10 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Telemetry Access</span>
            <div className="w-5 h-5 rounded-lg bg-accent-glow/20 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent-glow"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
            <Calendar size={32} className="text-tertiary/30" />
          </div>
          <p className="text-secondary font-medium mb-8 max-w-[200px]">No intelligence briefings scheduled for today.</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="h-12 px-8 bg-white/5 hover:bg-white/10 text-primary border border-white/10 rounded-2xl font-bold text-sm transition-all"
          >
            Initialize Session
          </button>
        </div>
      )}
    </div>

  );
}
