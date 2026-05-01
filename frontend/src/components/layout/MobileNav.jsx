import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  History, 
  BookOpen, 
  Calendar,
  UserCheck
} from 'lucide-react';

export default function MobileNav() {
  const { role } = useAuth();

  const navItems = role === 'mentor' 
    ? [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
        { to: '/attendance', icon: CheckSquare, label: 'Mark' },
        { to: '/history', icon: History, label: 'History' },
        { to: '/materials', icon: BookOpen, label: 'Docs' },
      ]
    : [
        { to: '/me/attendance', icon: UserCheck, label: 'Me' },
        { to: '/me/upcoming', icon: Calendar, label: 'Upcoming' },
        { to: '/me/materials', icon: BookOpen, label: 'Docs' },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-canvas/80 backdrop-blur-lg border-t border-subtle px-4 pb-safe">
      <div className="flex justify-around items-center h-[64px]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-accent-glow' : 'text-tertiary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
