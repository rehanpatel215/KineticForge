import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function TopBar() {
  const { user } = useAuth();
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Overview / Dashboard';
    if (path.includes('attendance') && !path.includes('me')) return 'Activity / Mark Attendance';
    if (path.includes('history')) return 'Activity / Student History';
    if (path.includes('materials') && !path.includes('me')) return 'Activity / Materials';
    if (path.includes('upload')) return 'Data / Upload CSV';
    if (path.includes('me/attendance')) return 'Overview / My Attendance';
    if (path.includes('me/upcoming')) return 'Overview / Upcoming';
    if (path.includes('me/materials')) return 'Resources / Materials';
    return 'Overview';
  };

  return (
    <header className="h-[80px] px-6 lg:px-12 flex items-center justify-between border-b border-border-subtle bg-canvas/30 backdrop-blur-xl sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-accent-glow to-accent-blue rounded-xl flex items-center justify-center shadow-neon">
            <span className="text-white font-display font-black italic">K</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-micro text-accent-glow/60 mb-0.5 hidden sm:block">System Path</div>
          <div className="text-sm text-secondary font-medium hidden sm:block tracking-tight">
            {getBreadcrumb().split(' / ').map((part, i, arr) => (
              <React.Fragment key={i}>
                <span className={i === arr.length - 1 ? 'text-primary font-semibold' : ''}>{part}</span>
                {i < arr.length - 1 && <span className="mx-2 text-tertiary/40">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-accent-glow transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Command Search..." 
            className="w-[320px] bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-accent-glow/50 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,210,255,0.1)] outline-none transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-tertiary font-mono">
            ⌘K
          </div>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-border-subtle/50">
          <div className="flex flex-col items-end hidden sm:flex">
            <div className="text-sm font-semibold text-primary">{user?.display_name || 'User'}</div>
            <div className="text-[10px] text-accent-glow font-bold uppercase tracking-widest leading-none mt-0.5">Online</div>
          </div>
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-accent-glow blur-md opacity-0 group-hover:opacity-20 transition-opacity" />
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center text-primary font-bold relative overflow-hidden">
              <div className="absolute inset-0 bg-accent-glow/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-canvas shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </div>
    </header>
  );
}

