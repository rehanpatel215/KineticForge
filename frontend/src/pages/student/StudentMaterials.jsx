import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Video, 
  FileText, 
  ExternalLink, 
  LayoutGrid,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function StudentMaterials() {
  const [sessionsWithMaterials, setSessionsWithMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Fetch sessions and their materials
      const { data, error } = await supabase
        .from('sessions')
        .select('*, materials(*)')
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Filter out sessions that have no materials
      setSessionsWithMaterials(data?.filter(s => s.materials && s.materials.length > 0) || []);
    } catch (err) {
      console.error("Error fetching materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessionsWithMaterials.filter(session => {
    const matchesSearch = session.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        session.materials.some(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMonth = selectedMonth === 'all' || session.month_number.toString() === selectedMonth;
    
    return matchesSearch && matchesMonth;
  });

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'recording': return <Video size={18} className="text-danger" />;
      case 'slides': return <LayoutGrid size={18} className="text-warning" />;
      case 'document': return <FileText size={18} className="text-info" />;
      default: return <ExternalLink size={18} className="text-accent-glow" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-14 bg-surface-raised rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-surface-raised rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-subtle/50">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-xs font-bold uppercase tracking-widest">
            Knowledge Repository
          </div>
          <h1 className="text-display-md text-primary font-display flex items-center gap-4">
            <div className="p-3 bg-surface-raised rounded-2xl shadow-inner">
              <BookOpen className="text-accent-glow" size={32} />
            </div>
            Class Materials
          </h1>
          <p className="text-body-lg text-tertiary max-w-xl">
            Access recordings, slides, and notes from all bootcamp sessions. Sync your learning at your own pace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search topics or files..."
              className="w-full pl-12 pr-4 py-3.5 bg-surface-inset border border-default rounded-2xl text-sm text-primary placeholder:text-tertiary focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <select 
              className="appearance-none pl-12 pr-12 py-3.5 bg-surface-inset border border-default rounded-2xl text-sm text-primary focus:border-accent-glow outline-none transition-all cursor-pointer min-w-[160px]"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              <option value="4">Month 4</option>
              <option value="5">Month 5</option>
              <option value="6">Month 6</option>
            </select>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={20} />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions.map((session) => (
            <div key={session.id} className="group bg-surface bg-card-gradient border border-subtle hover:border-default rounded-2xl p-6 shadow-[var(--shadow-card)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-surface-raised border border-subtle rounded text-[10px] font-bold text-tertiary uppercase tracking-wider">
                  <Calendar size={12} />
                  {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <span className="text-[10px] font-bold text-accent-glow uppercase tracking-widest bg-accent-glow/10 px-2 py-1 rounded">
                  Month {session.month_number}
                </span>
              </div>

              <h3 className="text-h3 text-primary mb-6 line-clamp-2 min-h-[56px] group-hover:text-accent-glow transition-colors">
                {session.topic}
              </h3>

              <div className="space-y-3">
                {session.materials.map((m) => (
                  <a 
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 bg-surface-inset border border-subtle hover:border-accent-glow hover:bg-surface-raised rounded-xl transition-all group/item"
                  >
                    <div className="p-2 bg-surface rounded-lg">
                      {getMaterialIcon(m.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-primary truncate group-hover/item:text-accent-glow transition-colors">{m.title}</p>
                      <p className="text-[10px] text-tertiary uppercase tracking-widest mt-0.5">{m.type}</p>
                    </div>
                    <ExternalLink size={14} className="text-tertiary opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 bg-surface-inset border border-dashed border-subtle rounded-3xl">
          <div className="w-20 h-20 bg-surface-raised rounded-full flex items-center justify-center text-tertiary opacity-30">
            <Layers size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-h3 text-primary">No materials found</h3>
            <p className="text-body text-secondary max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
          <button 
            onClick={() => {setSearchTerm(''); setSelectedMonth('all');}}
            className="text-sm font-bold text-accent-glow hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Help Banner */}
      <div className="bg-surface-raised/50 border border-subtle rounded-3xl p-8 flex items-center gap-8 shadow-inner">
        <div className="p-4 bg-surface rounded-2xl text-accent-glow">
          <BookOpen size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="text-body-lg font-bold text-primary">Missed a session?</h4>
          <p className="text-body-sm text-secondary">All recordings and slides are uploaded within 24 hours of the class completion. You can catch up on any missed topics here.</p>
        </div>
      </div>

    </div>
  );
}
