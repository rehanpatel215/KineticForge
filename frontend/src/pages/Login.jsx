import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';

export default function Login() {
  const [activeTab, setActiveTab] = useState('mentor'); // 'mentor' | 'student'
  const [identifier, setIdentifier] = useState(''); // Email or USN
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const navigate = useNavigate();
  const { session } = useAuth();

  // If already logged in, redirect handled in app routing or RoleGuard, 
  // but we can also redirect here if needed.
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let email = identifier;
    if (activeTab === 'student') {
      email = `${identifier}@forge.local`;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check if student and needs password change
      if (activeTab === 'student' && password === identifier) {
        setNeedsPasswordChange(true);
        setLoading(false);
        return; // Don't redirect yet
      }

      // Fetch user role to route correctly
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userProfile?.role === 'mentor') {
        navigate('/dashboard');
      } else {
        navigate('/me/attendance');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;
      
      // Successfully updated, redirect
      navigate('/me/attendance');
    } catch (err) {
      setError(err.message || 'Failed to update password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-glow/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-blue/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[var(--background-image-dot-grid)] bg-[length:var(--background-size-dot-grid)] pointer-events-none opacity-20" />

      <div className="glass-panel rounded-3xl p-10 max-w-[460px] w-full border border-white/10 shadow-neon relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-accent-glow to-accent-blue rounded-2xl flex items-center justify-center shadow-neon mx-auto mb-6 group relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-white font-display font-black text-3xl italic tracking-tighter">K</span>
          </div>
          <h1 className="text-display-sm text-primary font-display tracking-tight leading-none mb-2">Kinetic<span className="text-accent-glow">Forge</span></h1>
          <p className="text-secondary text-sm font-medium tracking-wide">Enter the control matrix</p>
        </div>

        {needsPasswordChange ? (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="bg-warning/10 border border-warning/20 p-4 rounded-2xl mb-6 flex gap-3">
              <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center text-warning text-xs font-bold">!</div>
              <p className="text-warning text-xs leading-relaxed font-medium">
                Security protocol: Please initialize a new password to continue.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-micro text-tertiary px-1">New System Password</label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 h-[52px] text-primary text-sm focus:border-accent-glow/50 focus:bg-white/[0.06] focus:shadow-neon outline-none transition-all"
                placeholder="Initialize new password"
              />
            </div>
            
            {error && (
              <div className="text-danger text-[11px] font-bold uppercase tracking-wider text-center animate-shake">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-accent-glow text-void rounded-2xl font-bold text-sm shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Initializing...' : 'Verify & Synchronize'}
            </button>
          </form>
        ) : (
          <>
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl mb-10 border border-white/5">
              <button 
                onClick={() => setActiveTab('mentor')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'mentor' ? 'bg-white/10 text-primary shadow-neon border border-white/10' : 'text-tertiary hover:text-secondary'}`}
              >
                Mentor
              </button>
              <button 
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${activeTab === 'student' ? 'bg-white/10 text-primary shadow-neon border border-white/10' : 'text-tertiary hover:text-secondary'}`}
              >
                Student
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-micro text-tertiary px-1 uppercase">
                  {activeTab === 'mentor' ? 'Command Email' : 'System ID (USN)'}
                </label>
                <input 
                  type={activeTab === 'mentor' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 h-[52px] text-primary text-sm focus:border-accent-glow/50 focus:bg-white/[0.06] focus:shadow-neon outline-none transition-all placeholder:text-tertiary/50"
                  placeholder={activeTab === 'mentor' ? "commander@forge.local" : "Node-001"}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between px-1">
                  <label className="block text-micro text-tertiary uppercase">Access Key</label>
                  {activeTab === 'mentor' && (
                    <a href="#" className="text-[10px] text-accent-glow font-bold uppercase tracking-widest hover:neon-glow transition-all">Recover</a>
                  )}
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 h-[52px] text-primary text-sm focus:border-accent-glow/50 focus:bg-white/[0.06] focus:shadow-neon outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-danger text-[11px] font-bold uppercase tracking-wider text-center">
                  Authentication Failed: {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-accent-glow text-void rounded-2xl font-bold text-sm shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

