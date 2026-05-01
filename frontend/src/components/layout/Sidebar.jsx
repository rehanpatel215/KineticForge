import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  History, 
  BookOpen, 
  Upload, 
  UserCheck, 
  Calendar, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const { role, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 h-[44px] px-4 rounded-lg text-body transition-colors ${
          isActive 
            ? 'bg-surface-raised text-primary shadow-[var(--shadow-card)] border-l-2 border-l-accent-glow' 
            : 'text-secondary hover:text-primary hover:bg-surface'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="w-[260px] hidden md:flex flex-col bg-canvas border-r border-subtle h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-surface-raised rounded-lg flex items-center justify-center border border-default">
          <span className="text-accent-glow font-display font-bold">F</span>
        </div>
        <span className="text-h3 font-display text-primary">ForgeTrack</span>
      </div>

      <div className="px-6 pb-6 border-b border-subtle mb-6">
        <div className="text-body-sm text-primary font-medium truncate">
          Welcome Back, {user?.display_name || 'User'}
        </div>
        <div className="text-caption text-tertiary mt-1">
          {role === 'mentor' ? 'Mentor' : 'Student'}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-6 overflow-y-auto">
        {role === 'mentor' && (
          <>
            <div>
              <div className="text-label text-tertiary uppercase tracking-widest px-2 mb-2">Overview</div>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>
            
            <div>
              <div className="text-label text-tertiary uppercase tracking-widest px-2 mb-2">Activity</div>
              <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
              <NavItem to="/history" icon={History} label="Student History" />
              <NavItem to="/materials" icon={BookOpen} label="Materials" />
            </div>

            <div>
              <div className="text-label text-tertiary uppercase tracking-widest px-2 mb-2">Data</div>
              <NavItem to="/upload" icon={Upload} label="Upload CSV" />
            </div>
          </>
        )}

        {role === 'student' && (
          <>
            <div>
              <div className="text-label text-tertiary uppercase tracking-widest px-2 mb-2">Overview</div>
              <NavItem to="/me/attendance" icon={UserCheck} label="My Attendance" />
              <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming" />
            </div>
            
            <div>
              <div className="text-label text-tertiary uppercase tracking-widest px-2 mb-2">Resources</div>
              <NavItem to="/me/materials" icon={BookOpen} label="Materials" />
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-subtle">
        <div className="text-label text-tertiary uppercase tracking-widest px-2 mb-2">Account</div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 h-[44px] px-4 rounded-lg text-body text-secondary hover:text-primary hover:bg-surface transition-colors"
        >
          <LogOut size={20} strokeWidth={1.75} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
