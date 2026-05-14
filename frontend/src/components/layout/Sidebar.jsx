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
        `flex items-center gap-3 h-[44px] px-4 rounded-xl text-sm transition-all duration-300 relative group ${
          isActive 
            ? 'bg-accent-glow/10 text-primary shadow-[0_0_20px_rgba(0,210,255,0.1)]' 
            : 'text-secondary hover:text-primary hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 w-1 h-6 bg-accent-glow rounded-r-full shadow-[0_0_12px_rgba(0,210,255,0.8)]" />
          )}
          <Icon size={18} className={`${isActive ? 'text-accent-glow' : 'group-hover:text-primary'}`} strokeWidth={isActive ? 2 : 1.75} />
          <span className={isActive ? 'font-medium neon-glow' : ''}>{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <aside className="w-[280px] hidden md:flex flex-col glass-panel border-r border-border-subtle h-screen sticky top-0 z-20">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-accent-glow to-accent-blue rounded-xl flex items-center justify-center shadow-neon relative group overflow-hidden">
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-white font-display font-black text-xl italic tracking-tighter">K</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-display font-bold text-primary tracking-tight">Kinetic<span className="text-accent-glow">Forge</span></span>
          <span className="text-[10px] text-accent-glow/60 uppercase tracking-[0.2em] font-bold">Intelligence</span>
        </div>
      </div>

      <div className="px-6 pb-6 mb-6 border-b border-border-subtle/50">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-accent-glow/20 to-transparent border border-accent-glow/20 flex items-center justify-center text-accent-glow font-bold">
            {user?.display_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-primary truncate">
              {user?.display_name || 'User'}
            </div>
            <div className="text-[10px] text-tertiary uppercase tracking-wider">
              {role || 'Member'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
        {role === 'mentor' && (
          <>
            <div>
              <div className="text-micro text-tertiary px-4 mb-3">Core Navigation</div>
              <div className="space-y-1">
                <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              </div>
            </div>
            
            <div>
              <div className="text-micro text-tertiary px-4 mb-3">Activity Management</div>
              <div className="space-y-1">
                <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
                <NavItem to="/history" icon={History} label="Student History" />
                <NavItem to="/materials" icon={BookOpen} label="Materials" />
              </div>
            </div>

            <div>
              <div className="text-micro text-tertiary px-4 mb-3">System Data</div>
              <div className="space-y-1">
                <NavItem to="/upload" icon={Upload} label="Data Ingestion" />
              </div>
            </div>
          </>
        )}

        {role === 'student' && (
          <>
            <div>
              <div className="text-micro text-tertiary px-4 mb-3">Student Hub</div>
              <div className="space-y-1">
                <NavItem to="/me/attendance" icon={UserCheck} label="Attendance Tracker" />
                <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming Events" />
              </div>
            </div>
            
            <div>
              <div className="text-micro text-tertiary px-4 mb-3">Learning Assets</div>
              <div className="space-y-1">
                <NavItem to="/me/materials" icon={BookOpen} label="Resource Library" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-6 border-t border-border-subtle/50 bg-white/[0.02]">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 h-[44px] px-4 rounded-xl text-sm text-secondary hover:text-danger hover:bg-danger/10 transition-all duration-300 group"
        >
          <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Logout System</span>
        </button>
      </div>
    </aside>
  );
}

