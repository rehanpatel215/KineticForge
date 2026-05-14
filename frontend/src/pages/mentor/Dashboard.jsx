import React from 'react';
import { useAuth } from '../../components/auth/AuthContext';
import TickerStrip from './dashboard/TickerStrip';
import TodaySessionCard from './dashboard/TodaySessionCard';
import TodayAttendanceCard from './dashboard/TodayAttendanceCard';
import ProgramOverviewCard from './dashboard/ProgramOverviewCard';
import RecentActivityCard from './dashboard/RecentActivityCard';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-glow/10 border border-accent-glow/20 text-accent-glow text-[10px] font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-glow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-glow"></span>
            </span>
            System Active
          </div>
          <h1 className="text-display-md md:text-display-lg text-primary font-display tracking-tight leading-none">
            Forge <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-accent-glow/50 neon-glow">Intelligence.</span>
          </h1>
          <p className="text-body-lg text-secondary max-w-2xl">
            Welcome back, <span className="text-primary font-semibold">{user?.display_name?.split(' ')[0] || 'Commander'}</span>. 
            All systems are operational for the Forge AI-ML Bootcamp.
          </p>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md">
            <button className="px-4 py-2 text-xs font-semibold text-primary bg-white/10 rounded-xl shadow-neon border border-white/10 transition-all">Today</button>
            <button className="px-4 py-2 text-xs font-semibold text-secondary hover:text-primary transition-all">Week</button>
            <button className="px-4 py-2 text-xs font-semibold text-secondary hover:text-primary transition-all">Month</button>
          </div>
          <button className="h-12 px-6 bg-gradient-to-br from-accent-glow to-accent-blue rounded-2xl text-white font-bold text-sm shadow-neon-strong hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
            <span>Generate Report</span>
            <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </div>
          </button>
        </div>
      </div>


      {/* Ticker Strip */}
      <TickerStrip />

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Row 1: Today's Focus (takes up 2 columns each on large screens, or 1 each on XL) */}
        <div className="xl:col-span-2">
          <TodaySessionCard />
        </div>
        <div className="xl:col-span-2">
          <TodayAttendanceCard />
        </div>

        {/* Row 2: Analytics & Activity */}
        <div className="xl:col-span-2">
          <ProgramOverviewCard />
        </div>
        <div className="xl:col-span-2">
          <RecentActivityCard />
        </div>
        
      </div>
    </div>
  );
}
