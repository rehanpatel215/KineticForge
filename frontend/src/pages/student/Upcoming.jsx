import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function Upcoming() {
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch upcoming sessions
      const { data: upcoming } = await supabase
        .from('sessions')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);

      // 2. Fetch recent past sessions
      const { data: past } = await supabase
        .from('sessions')
        .select('*')
        .lt('date', today)
        .order('date', { ascending: false })
        .limit(3);

      setUpcomingSessions(upcoming || []);
      setPastSessions(past || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-surface-raised rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-surface-raised rounded-2xl"></div>
          <div className="h-96 bg-surface-raised rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const nextSession = upcomingSessions[0];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section - Next Session */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-accent-glow/20 to-success/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-surface bg-card-gradient border border-strong rounded-3xl p-8 lg:p-12 shadow-2xl overflow-hidden">
          
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={120} className="text-accent-glow" />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-xs font-bold uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-glow animate-pulse"></div>
                Next Scheduled Session
              </div>
              
              {nextSession ? (
                <>
                  <h1 className="text-display-lg text-primary font-display leading-tight">
                    {nextSession.topic}
                  </h1>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-surface-raised rounded-xl text-secondary group-hover:text-primary transition-colors">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-tertiary uppercase font-bold tracking-widest">Date</p>
                        <p className="text-sm font-medium text-primary">
                          {new Date(nextSession.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-surface-raised rounded-xl text-secondary group-hover:text-primary transition-colors">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-tertiary uppercase font-bold tracking-widest">Duration</p>
                        <p className="text-sm font-medium text-primary">{nextSession.duration_hours} Hours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-surface-raised rounded-xl text-secondary group-hover:text-primary transition-colors">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-tertiary uppercase font-bold tracking-widest">Type</p>
                        <p className="text-sm font-medium text-primary capitalize">{nextSession.session_type}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-1000">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-accent-glow/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="w-24 h-24 bg-surface-raised rounded-3xl flex items-center justify-center border border-default relative">
                      <Sparkles size={40} className="text-tertiary opacity-40" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-display-md text-primary font-display">The void is calm...</h2>
                    <p className="text-body-lg text-tertiary max-w-md mx-auto">
                      No upcoming sessions scheduled yet. Use this time to refine your craft or dive into past materials.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/me/materials')}
                    className="px-8 py-3 bg-surface-raised border border-default rounded-xl text-primary font-medium hover:bg-surface hover:border-accent-glow transition-all"
                  >
                    Explore Materials
                  </button>
                </div>
              )}
            </div>

            {nextSession && (
              <div className="bg-surface-raised/50 border border-subtle p-6 rounded-2xl backdrop-blur-sm lg:w-80">
                <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <Info size={16} className="text-accent-glow" /> Mentor Notes
                </h4>
                <p className="text-sm text-secondary leading-relaxed italic">
                  {nextSession.notes || "No specific notes for this session. Please be on time and bring your laptop for the hands-on lab."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Timeline of Upcoming */}
        <div className="space-y-6">
          <h3 className="text-h2 text-primary flex items-center gap-2">
            <Layers size={22} className="text-accent-glow" /> Scheduled Pipeline
          </h3>
          
          <div className="space-y-4">
            {upcomingSessions.slice(1).map((s, i) => (
              <div key={s.id} className="group flex items-center gap-6 p-4 bg-surface hover:bg-surface-raised border border-subtle hover:border-default rounded-2xl transition-all shadow-sm">
                <div className="w-14 h-14 bg-surface-inset rounded-xl flex flex-col items-center justify-center text-center border border-subtle group-hover:border-accent-glow transition-colors">
                  <span className="text-[10px] font-bold text-tertiary uppercase">{new Date(s.date).toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-primary">{new Date(s.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-body-lg font-medium text-primary group-hover:text-accent-glow transition-colors">{s.topic}</h4>
                  <p className="text-caption text-secondary mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {s.duration_hours}h</span>
                    <span className="flex items-center gap-1 capitalize"><MapPin size={12} /> {s.session_type}</span>
                  </p>
                </div>
                <ChevronRight size={20} className="text-tertiary group-hover:text-primary transition-colors" />
              </div>
            ))}
            {upcomingSessions.length <= 1 && (
              <div className="p-8 border border-dashed border-subtle rounded-2xl text-center text-tertiary italic">
                No other sessions scheduled yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Past Context */}
        <div className="space-y-6">
          <h3 className="text-h2 text-primary flex items-center gap-2">
            <BookOpen size={22} className="text-tertiary" /> Last Completed
          </h3>
          
          <div className="space-y-4">
            {pastSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-6 p-4 bg-void border border-subtle rounded-2xl opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <div className="w-14 h-14 bg-surface-inset rounded-xl flex flex-col items-center justify-center text-center border border-subtle">
                  <span className="text-[10px] font-bold text-tertiary uppercase">{new Date(s.date).toLocaleString('en-US', { month: 'short' })}</span>
                  <span className="text-lg font-bold text-tertiary">{new Date(s.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-body-lg font-medium text-secondary">{s.topic}</h4>
                  <p className="text-caption text-tertiary mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {s.duration_hours}h</span>
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-success" /> Completed</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Program Summary/Status */}
      <div className="bg-surface bg-card-gradient border border-subtle rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="w-20 h-20 bg-accent-glow/10 rounded-full flex items-center justify-center text-accent-glow shrink-0 border border-accent-glow/20">
          <Calendar size={32} />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-h3 text-primary">Need to reschedule?</h4>
          <p className="text-body text-secondary max-w-xl">
            Attendance policy requires notification 24 hours in advance for planned absences. Contact your mentor via the Discord channel if you cannot attend a scheduled session.
          </p>
        </div>
        <button className="md:ml-auto w-full md:w-auto px-6 py-3 bg-surface-raised border border-default rounded-xl text-primary font-medium hover:bg-surface transition-colors">
          View Policy
        </button>
      </div>

    </div>
  );
}
