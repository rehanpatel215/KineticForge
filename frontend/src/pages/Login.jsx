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
    <div className="min-h-screen bg-void bg-[url('var(--glow-cosmic)')] bg-no-repeat bg-[center_top_-100px] flex items-center justify-center p-4">
      <div className="bg-surface bg-card-gradient border border-subtle rounded-2xl p-12 max-w-[440px] w-full shadow-[var(--shadow-card)]">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-surface-raised rounded-xl flex items-center justify-center border border-default mx-auto mb-4">
            <span className="text-accent-glow font-display font-bold text-xl">F</span>
          </div>
          <h1 className="text-h2 text-primary font-display">ForgeTrack</h1>
        </div>

        {needsPasswordChange ? (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="bg-warning-bg border border-warning-border p-4 rounded-lg mb-6">
              <p className="text-warning text-caption">
                For security reasons, please change your default password before continuing.
              </p>
            </div>
            <div>
              <label className="block text-label text-secondary mb-2 uppercase tracking-widest">New Password</label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none"
                placeholder="Enter new password"
              />
            </div>
            
            {error && <p className="text-danger text-caption">{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-fg-primary text-void rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password & Sign In'}
            </button>
          </form>
        ) : (
          <>
            <div className="flex bg-surface-inset p-1 rounded-lg mb-8">
              <button 
                onClick={() => setActiveTab('mentor')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'mentor' ? 'bg-surface-raised text-primary shadow-[var(--shadow-card)]' : 'text-secondary hover:text-primary'}`}
              >
                Mentor Login
              </button>
              <button 
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'student' ? 'bg-surface-raised text-primary shadow-[var(--shadow-card)]' : 'text-secondary hover:text-primary'}`}
              >
                Student Login
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-label text-secondary mb-2 uppercase tracking-widest">
                  {activeTab === 'mentor' ? 'Email Address' : 'USN'}
                </label>
                <input 
                  type={activeTab === 'mentor' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none placeholder:text-tertiary"
                  placeholder={activeTab === 'mentor' ? "nischay@theboringpeople.in" : "4SH24CS001"}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-label text-secondary uppercase tracking-widest">Password</label>
                  {activeTab === 'mentor' && (
                    <a href="#" className="text-caption text-accent-glow hover:underline">Forgot password?</a>
                  )}
                </div>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-inset border border-default rounded-md px-4 h-[44px] text-primary text-[14px] focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-danger text-caption">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-fg-primary text-void rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
