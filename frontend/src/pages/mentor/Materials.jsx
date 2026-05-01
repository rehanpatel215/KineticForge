import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Plus, Filter, MonitorPlay, FileText, Link as LinkIcon, Book, Trash2 } from 'lucide-react';
import Modal from '../../components/common/Modal';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [months, setMonths] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formSession, setFormSession] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('slides');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch all sessions for the dropdown
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });
      
      setSessions(sessionData || []);

      // Extract unique months for filter
      if (sessionData) {
        const uniqueMonths = [...new Set(sessionData.map(s => s.month_number))].sort((a,b)=>a-b);
        setMonths(uniqueMonths);
      }

      // Fetch materials joined with sessions
      const { data: materialData } = await supabase
        .from('materials')
        .select('*, sessions(topic, date, month_number)')
        .order('created_at', { ascending: false });

      setMaterials(materialData || []);
    } catch (err) {
      console.error("Error fetching materials", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // URL Validation
    try {
      new URL(formUrl);
    } catch (_) {
      setFormError("Please enter a valid URL (e.g. https://google.com)");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([{
          session_id: formSession,
          title: formTitle,
          type: formType,
          url: formUrl,
          description: formDesc
        }])
        .select('*, sessions(topic, date, month_number)')
        .single();

      if (error) throw error;
      
      // Update local state to reflect instantly
      setMaterials([data, ...materials]);
      setShowModal(false);
      
      // Reset form
      setFormSession('');
      setFormTitle('');
      setFormUrl('');
      setFormDesc('');
      setFormType('slides');
      
    } catch (err) {
      setFormError(err.message || 'Failed to add material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;
      setMaterials(materials.filter(m => m.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      alert("Failed to delete material: " + err.message);
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'slides': return <MonitorPlay size={16} />;
      case 'recording': return <MonitorPlay size={16} />;
      case 'document': return <FileText size={16} />;
      default: return <LinkIcon size={16} />;
    }
  };

  // Group filtered materials by session
  const filtered = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                        m.sessions?.topic.toLowerCase().includes(search.toLowerCase());
    const matchMonth = monthFilter === 'all' || m.sessions?.month_number.toString() === monthFilter;
    return matchSearch && matchMonth;
  });

  const grouped = filtered.reduce((acc, curr) => {
    const sessionId = curr.session_id;
    if (!acc[sessionId]) {
      acc[sessionId] = {
        session: curr.sessions,
        materials: []
      };
    }
    acc[sessionId].materials.push(curr);
    return acc;
  }, {});

  const sortedGroups = Object.values(grouped).sort((a, b) => new Date(b.session?.date) - new Date(a.session?.date));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display-md text-primary font-display mb-2">Materials Library</h1>
          <p className="text-body text-secondary">Manage and access session resources.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-fg-primary text-void flex items-center justify-center gap-2 rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors"
        >
          <Plus size={18} /> Add Material
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-surface bg-card-gradient border border-subtle rounded-xl shadow-[var(--shadow-card)]">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
          <input 
            type="text" 
            placeholder="Search by topic or title..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-inset border border-default rounded-md pl-10 pr-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none placeholder:text-tertiary"
          />
        </div>
        <div className="sm:w-48 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
          <select 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full bg-surface-inset border border-default rounded-md pl-10 pr-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none appearance-none"
          >
            <option value="all">All Months</option>
            {months.map(m => (
              <option key={m} value={m}>Month {m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-surface/50 border border-subtle rounded-xl p-6 h-56 animate-pulse flex flex-col gap-4">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-surface-raised rounded"></div>
                <div className="h-6 w-48 bg-surface-raised rounded"></div>
              </div>
              <div className="flex-1 space-y-3 mt-4">
                <div className="h-4 w-full bg-surface-raised rounded"></div>
                <div className="h-4 w-full bg-surface-raised rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedGroups.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-subtle rounded-xl text-secondary">
          <Book size={32} className="mx-auto mb-4 text-tertiary" />
          <p>No materials found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGroups.map((group, idx) => (
            <div key={idx} className="bg-surface bg-card-gradient border border-subtle rounded-xl p-6 shadow-[var(--shadow-card)] flex flex-col hover:border-accent-glow/50 transition-colors">
              <div className="mb-4 pb-4 border-b border-subtle">
                <div className="text-label text-tertiary uppercase tracking-widest mb-1">
                  {new Date(group.session?.date).toLocaleDateString()} • Month {group.session?.month_number}
                </div>
                <h3 className="text-h3 text-primary line-clamp-2" title={group.session?.topic}>{group.session?.topic}</h3>
              </div>
              
              <ul className="flex-1 space-y-4">
                {group.materials.map(m => (
                  <li key={m.id}>
                    <div className="flex items-start justify-between gap-2 group/item">
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="group/link flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 text-accent-glow group-hover/link:text-primary transition-colors shrink-0">
                          {getIconForType(m.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-secondary group-hover/link:text-primary group-hover/link:underline transition-all line-clamp-1">{m.title}</p>
                          {m.description && <p className="text-caption text-tertiary line-clamp-1 mt-0.5">{m.description}</p>}
                        </div>
                      </a>
                      <button 
                        onClick={() => setDeletingId(m.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-1.5 text-tertiary hover:text-danger hover:bg-danger-bg rounded-lg transition-all"
                        title="Delete material"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        message="Are you sure you want to remove this material? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm p-4">
          <div className="bg-surface bg-card-gradient border border-subtle rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-h2 text-primary mb-6">Add Material</h3>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              
              <div>
                <label className="block text-label text-secondary uppercase tracking-widest mb-1">Session</label>
                <select required value={formSession} onChange={e=>setFormSession(e.target.value)} className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none">
                  <option value="" disabled>Select a session</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{new Date(s.date).toLocaleDateString()} - {s.topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label text-secondary uppercase tracking-widest mb-1">Title</label>
                <input required type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} placeholder="e.g. React State Slides" className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none" />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-label text-secondary uppercase tracking-widest mb-1">Type</label>
                  <select value={formType} onChange={e=>setFormType(e.target.value)} className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none">
                    <option value="slides">Slides</option>
                    <option value="recording">Recording</option>
                    <option value="document">Document</option>
                    <option value="link">Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-label text-secondary uppercase tracking-widest mb-1">URL</label>
                <input required type="url" value={formUrl} onChange={e=>setFormUrl(e.target.value)} placeholder="https://..." className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none" />
              </div>

              <div>
                <label className="block text-label text-secondary uppercase tracking-widest mb-1">Description (Optional)</label>
                <input type="text" value={formDesc} onChange={e=>setFormDesc(e.target.value)} placeholder="Brief description..." className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary outline-none" />
              </div>

              {formError && <p className="text-danger text-sm">{formError}</p>}

              <div className="flex gap-4 justify-end pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-md font-medium text-secondary hover:text-primary transition-colors">
                  Cancel
                </button>
                <button disabled={saving} type="submit" className="px-5 py-2.5 rounded-md font-medium bg-fg-primary text-void hover:bg-[#E5E5E7] transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : 'Add Material'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
