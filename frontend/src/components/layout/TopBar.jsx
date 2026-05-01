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
    <header className="h-[72px] px-6 lg:px-12 flex items-center justify-between border-b border-subtle bg-canvas/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-surface-raised rounded-lg flex items-center justify-center border border-default">
            <span className="text-accent-glow font-display font-bold">F</span>
          </div>
        </div>
        <div className="text-body-sm text-tertiary font-medium hidden sm:block">
          {getBreadcrumb()}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-[240px] bg-surface-inset border border-default rounded-full pl-9 pr-4 py-2 text-sm text-primary placeholder:text-tertiary focus:border-accent-glow focus:shadow-[var(--shadow-focus)] outline-none"
          />
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-subtle">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-primary">{user?.display_name || 'User'}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-surface-raised border border-default flex items-center justify-center text-primary font-medium">
            {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
